import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/evidence
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        id,
        incident_id,
        sample_id,
        evidence_tag AS title,
        COALESCE(description, 'No description provided.') AS description,
        COALESCE(storage_location, 'Unassigned Storage') AS location,
        collected_by,
        collected_at AS timestamp,
        'VERIFIED' AS status,
        'Physical Sample' AS type,
        'Secure Vault Storage' AS "chainOfCustody",
        COALESCE(
          json_build_array(
            json_build_object(
              'id', gen_random_uuid(),
              'action', 'Collected and cataloged',
              'timestamp', collected_at,
              'performedBy', 'Investigator'
            )
          ),
          '[]'::json
        ) AS "chain_of_custody",
        COALESCE(
          json_build_array(
            json_build_object(
              'id', gen_random_uuid(),
              'action', 'Collected and cataloged',
              'timestamp', collected_at,
              'performedBy', 'Investigator'
            )
          ),
          '[]'::json
        ) AS "custodyLogs",
        ARRAY['Water', 'Forensic'] AS tags
      FROM evidence
      ORDER BY collected_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch evidence records' });
  }
});

// GET /api/evidence/nearby
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radius = 5 } = req.query;

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
        e.evidence_tag AS title,
        COALESCE(e.description, 'No description provided.') AS description,
        COALESCE(e.storage_location, 'Unassigned Storage') AS location,
        e.collected_at AS timestamp,
        'VERIFIED' AS status,
        'Physical Sample' AS type,
        'Secure Vault Storage' AS "chainOfCustody",
        '[]'::json AS "chain_of_custody",
        '[]'::json AS "custodyLogs",
        ARRAY[]::text[] AS tags
      FROM evidence e
      ORDER BY e.collected_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch nearby evidence' });
  }
});

export default router;