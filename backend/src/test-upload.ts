import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './utils/storage';
import { pool } from './db';
import { logAuditEvent } from './utils/auditLogger';

async function runTestUpload() {
  try {
    const filePath = path.join(__dirname, '../../water_sample.csv');
    
    // 1. Read file & compute SHA-256 hash
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;
    const fileName = 'water_sample.csv';
    const mimeType = 'text/csv';

    // 2. Upload directly to S3 via backend client
    const key = `evidence-${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Body: fileBuffer,
    });

    await s3Client.send(command);
    const fileUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
    console.log(' Uploaded to Storage! File URL:', fileUrl);

    // 3. Save to database
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
      null,
      'Water Contamination Sample #8841',
      'Laboratory Analysis',
      tag,
      'Chemical analysis revealing elevated heavy metals.',
      fileUrl,
      fileHash,
      fileSize,
      mimeType,
    ];

    const result = await pool.query(query, values);
    const savedEvidence = result.rows[0];
    console.log(' Database Record Created! Evidence ID:', savedEvidence.id);

    // 4. Log Audit Event
    await logAuditEvent({
      evidenceId: savedEvidence.id,
      action: 'EVIDENCE_UPLOADED',
      performedBy: 'Investigator',
      details: {
        title: savedEvidence.title,
        file_hash: savedEvidence.file_hash,
        file_size: savedEvidence.file_size,
        mime_type: savedEvidence.mime_type,
      },
    });
    console.log(' Audit log written!');
    console.log('\nCopy this Evidence ID to test verification:', savedEvidence.id);
  } catch (err) {
    console.error('Test upload failed:', err);
  } finally {
    await pool.end();
  }
}

runTestUpload();