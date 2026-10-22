import { Router, Request, Response } from 'express';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { pool } from '../db';
import { s3Client, BUCKET_NAME, getUploadPresignedUrl } from '../utils/storage';
import { logAuditEvent } from '../utils/auditLogger';
import { authenticateJWT } from '../middleware/authMiddleware';
import { emitRealtimeEvent } from '../socket';

const router = Router();

// Protect all evidence routes with authentication middleware
router.use(authenticateJWT);

// Allowed MIME types for evidence uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/geo+json',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
  'application/octet-stream', // Generic binary for lab/sensor data (.sim, .dat)
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB limit

// POST /api/evidence/upload-url - Generate Presigned Upload URL with Validation
router.post('/upload-url', async (req: Request, res: Response): Promise<void> => {
  const { fileName, fileType, fileSize } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ message: 'fileName and fileType are required' });
    return;
  }

  // 1. Validate File MIME Type
  if (!ALLOWED_MIME_TYPES.has(fileType)) {
    res.status(400).json({ 
      message: `Invalid file type (${fileType}). Allowed types: Images, PDFs, CSV, JSON, Videos, Audio, and Lab Binaries.` 
    });
    return;
  }

  // 2. Validate File Size
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    res.status(400).json({ 
      message: 'File size exceeds maximum allowed limit of 100 MB.' 
    });
    return;
  }

  try {
    const key = `evidence-${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

    // Generate presigned upload URL using storage utility
    const uploadUrl = await getUploadPresignedUrl(key, fileType, 900);
    const fileUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;

    res.json({
      uploadUrl,
      fileUrl,
      key,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate upload URL' });
  }
});

// POST /api/evidence - Save Evidence record with SHA-256 hash & file metadata
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    incident_id,
    title,
    kind,
    description,
    file_url,
    file_hash,
    file_size,
    mime_type,
  } = req.body;

  if (!title) {
    res.status(400).json({ message: 'title is required' });
    return;
  }

  try {
    const tag = `EV-${Date.now().toString().slice(-6)}`;

    const query = `
      INSERT INTO evidence (
        incident_id, title, kind, evidence_tag, description,
        file_url, file_hash, file_size, mime_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified')
      RETURNING *;
    `;

    const values = [
      incident_id || null,
      title,
      kind || 'Digital Evidence',
      tag,
      description || null,
      file_url || null,
      file_hash || null,
      file_size || null,
      mime_type || null,
    ];

    const result = await pool.query(query, values);
    const savedEvidence = result.rows[0];

    const userEmail = (req as any).user?.email || 'Investigator';

    // Log audit entry for evidence upload
    await logAuditEvent({
      evidenceId: savedEvidence.id,
      action: 'EVIDENCE_UPLOADED',
      performedBy: userEmail,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        title: savedEvidence.title,
        file_hash: savedEvidence.file_hash,
        file_size: savedEvidence.file_size,
        mime_type: savedEvidence.mime_type,
      },
    });

    // Emit Realtime Event
    emitRealtimeEvent('EVIDENCE_HASHED', savedEvidence);

    res.status(201).json(savedEvidence);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to save evidence record' });
  }
});

// GET /api/evidence
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        id,
        incident_id,
        sample_id,
        COALESCE(title, evidence_tag, 'Untitled Evidence') AS title,
        COALESCE(description, 'No description provided.') AS description,
        COALESCE(storage_location, 'Unassigned Storage') AS location,
        collected_by,
        COALESCE(collected_at, created_at) AS timestamp,
        COALESCE(status, 'VERIFIED') AS status,
        COALESCE(kind, 'Physical Sample') AS type,
        file_url,
        file_hash,
        file_size,
        mime_type,
        'Secure Vault Storage' AS "chainOfCustody",
        ARRAY['Water', 'Forensic'] AS tags
      FROM evidence
      ORDER BY COALESCE(collected_at, created_at) DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch evidence records' });
  }
});

// GET /api/evidence/nearby
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ message: 'lat and lng parameters are required' });
    return;
  }

  try {
    const query = `
      SELECT 
        e.id,
        e.incident_id,
        e.sample_id,
        COALESCE(e.title, e.evidence_tag, 'Untitled Evidence') AS title,
        COALESCE(e.description, 'No description provided.') AS description,
        COALESCE(e.storage_location, 'Unassigned Storage') AS location,
        COALESCE(e.collected_at, e.created_at) AS timestamp,
        COALESCE(e.status, 'VERIFIED') AS status,
        COALESCE(e.kind, 'Physical Sample') AS type,
        e.file_url,
        e.file_hash,
        e.file_size,
        e.mime_type
      FROM evidence e
      ORDER BY COALESCE(e.collected_at, e.created_at) DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch nearby evidence' });
  }
});

// GET /api/evidence/:id/download-url - Generate Presigned Read URL for Private S3 Objects
router.get('/:id/download-url', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const dbResult = await pool.query('SELECT * FROM evidence WHERE id = $1', [id]);
    if (dbResult.rows.length === 0) {
      res.status(404).json({ message: 'Evidence record not found' });
      return;
    }

    const evidence = dbResult.rows[0];
    if (!evidence.file_url) {
      res.status(400).json({ message: 'Evidence record does not have a linked file' });
      return;
    }

    const urlParts = evidence.file_url.split('/');
    const key = urlParts[urlParts.length - 1];

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    res.json({ signedUrl, fileName: evidence.title, mimeType: evidence.mime_type });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate download URL' });
  }
});

// GET /api/evidence/:id/verify - Verify file integrity against stored SHA-256 hash
router.get('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const dbResult = await pool.query('SELECT * FROM evidence WHERE id = $1', [id]);
    if (dbResult.rows.length === 0) {
      res.status(404).json({ message: 'Evidence record not found' });
      return;
    }

    const evidence = dbResult.rows[0];
    if (!evidence.file_url || !evidence.file_hash) {
      res.status(400).json({ message: 'Evidence record does not have a linked storage file or hash' });
      return;
    }

    const urlParts = evidence.file_url.split('/');
    const key = urlParts[urlParts.length - 1];

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const s3Response = await s3Client.send(command);
    if (!s3Response.Body) {
      res.status(500).json({ message: 'Failed to retrieve object from storage' });
      return;
    }

    const byteArray = await s3Response.Body.transformToByteArray();
    const computedHash = crypto.createHash('sha256').update(byteArray).digest('hex');

    const isIntegrityIntact = computedHash.toLowerCase() === evidence.file_hash.toLowerCase();
    const status = isIntegrityIntact ? 'VERIFIED' : 'TAMPERED';
    const userEmail = (req as any).user?.email || 'Investigator';

    await logAuditEvent({
      evidenceId: evidence.id,
      action: isIntegrityIntact ? 'INTEGRITY_VERIFIED' : 'TAMPER_DETECTED',
      performedBy: userEmail,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        storedHash: evidence.file_hash,
        computedHash,
        status,
      },
    });

    res.json({
      id: evidence.id,
      storedHash: evidence.file_hash,
      computedHash,
      status,
      isIntegrityIntact,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to verify evidence integrity' });
  }
});

// GET /api/evidence/:id/audit-logs - Fetch chain of custody logs for an evidence item
router.get('/:id/audit-logs', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        id,
        evidence_id,
        event_type AS action,
        performed_by,
        details,
        ip_address,
        created_at
      FROM audit_logs
      WHERE evidence_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch audit logs' });
  }
});

// DELETE /api/evidence/:id - Delete evidence record and S3 object
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const dbResult = await pool.query('SELECT * FROM evidence WHERE id = $1', [id]);
    if (dbResult.rows.length === 0) {
      res.status(404).json({ message: 'Evidence record not found' });
      return;
    }

    const evidence = dbResult.rows[0];

    // Delete object from S3 if file_url exists
    if (evidence.file_url) {
      try {
        const urlParts = evidence.file_url.split('/');
        const key = urlParts[urlParts.length - 1];
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(command);
      } catch (s3Err) {
        console.warn('S3 object deletion warning:', s3Err);
      }
    }

    const userEmail = (req as any).user?.email || 'Investigator';

    // Log audit entry prior to record removal
    await logAuditEvent({
      evidenceId: evidence.id,
      action: 'EVIDENCE_DELETED',
      performedBy: userEmail,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        title: evidence.title,
        evidence_tag: evidence.evidence_tag,
        file_hash: evidence.file_hash,
      },
    });

    // Delete record from database
    await pool.query('DELETE FROM evidence WHERE id = $1', [id]);

    // Emit Realtime Event to sync connected frontend clients
    emitRealtimeEvent('EVIDENCE_HASHED', { id, action: 'DELETED' });

    res.json({ message: 'Evidence record deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete evidence record' });
  }
});

export default router;