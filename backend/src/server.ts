import express, { Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';
import authRoutes from './routes/authRoutes';
import evidenceRoutes from './routes/evidenceRoutes';
import osintRoutes from './routes/osintRoutes';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from './middleware/authMiddleware';
import { initSocket, emitRealtimeEvent } from './socket';
import { startThreatDetector } from './workers/threatDetector';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create HTTP server & bind Socket.IO
const httpServer = http.createServer(app);
initSocket(httpServer);

// -----------------------------------------------------------------------------
// MODULAR API ROUTES
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/osint', osintRoutes);

// -----------------------------------------------------------------------------
// CORE & SPATIAL API ROUTES
// -----------------------------------------------------------------------------

app.get('/api/health', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT PostGIS_Full_Version();');
    res.json({
      status: 'ok',
      message: 'EFIF Server is running',
      database: 'connected',
      postgisVersion: result.rows[0].postgis_full_version,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/sites/nearby', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { lat, lng, radius_meters } = req.query;

  if (!lat || !lng || !radius_meters) {
    res.status(400).json({ status: 'error', message: 'Missing lat, lng, or radius_meters parameters.' });
    return;
  }

  try {
    const query = `
      SELECT 
        id, site_name, site_type, 
        ST_AsGeoJSON(location)::json AS location,
        ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
      FROM monitoring_sites
      WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC;
    `;

    const result = await pool.query(query, [Number(lng), Number(lat), Number(radius_meters)]);
    res.json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/sites', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { site_name, site_type, description, latitude, longitude } = req.body;

  try {
    const query = `
      INSERT INTO monitoring_sites (site_name, site_type, description, location)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING id, site_name, site_type, description, ST_AsGeoJSON(location)::json AS location;
    `;

    const result = await pool.query(query, [site_name, site_type, description, longitude, latitude]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/sites', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, site_name, site_type, description, ST_AsGeoJSON(location)::json AS location, created_at
      FROM monitoring_sites;
    `;
    const result = await pool.query(query);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map((row) => ({
        type: 'Feature',
        geometry: row.location,
        properties: { id: row.id, site_name: row.site_name, site_type: row.site_type, description: row.description, created_at: row.created_at },
      })),
    };

    res.json(geojson);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/samples', authenticateJWT, authorizeRoles('admin', 'investigator', 'analyst'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { site_id, pollutant_type, concentration_value, unit, is_anomaly } = req.body;

  try {
    const query = `
      INSERT INTO forensic_samples (site_id, pollutant_type, concentration_value, unit, is_anomaly)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const result = await pool.query(query, [site_id, pollutant_type, concentration_value, unit, is_anomaly || false]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// INCIDENTS CRUD & SPATIAL RADIUS ROUTES
// -----------------------------------------------------------------------------

app.get('/api/incidents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, title, severity, status, created_by, 
             ST_AsGeoJSON(affected_area)::json AS affected_area,
             ST_AsGeoJSON(location)::json AS location,
             created_at
      FROM incidents;
    `;
    const result = await pool.query(query);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map((row) => ({
        type: 'Feature',
        geometry: row.location || row.affected_area,
        properties: { 
          id: row.id, 
          title: row.title, 
          severity: row.severity, 
          status: row.status, 
          created_by: row.created_by, 
          affected_area: row.affected_area,
          location: row.location,
          created_at: row.created_at 
        },
      })),
    };

    res.json(geojson);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/incidents/radius', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { lng, lat, radiusMeters = 5000 } = req.query;

  if (!lng || !lat) {
    res.status(400).json({ status: 'error', message: 'lng and lat query parameters are required.' });
    return;
  }

  try {
    const query = `
      SELECT id, title, severity, status, 
             ST_AsGeoJSON(location)::json AS location,
             ST_AsGeoJSON(affected_area)::json AS affected_area,
             ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
      FROM incidents
      WHERE location IS NOT NULL 
        AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC;
    `;

    const result = await pool.query(query, [parseFloat(lng as string), parseFloat(lat as string), parseFloat(radiusMeters as string)]);
    res.json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/incidents/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const incidentQuery = `
      SELECT id, title, severity, status, created_by,
             ST_AsGeoJSON(affected_area)::json AS affected_area,
             ST_AsGeoJSON(location)::json AS location,
             created_at
      FROM incidents
      WHERE id = $1;
    `;
    const incidentResult = await pool.query(incidentQuery, [id]);

    if (incidentResult.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Incident not found.' });
      return;
    }

    const incident = incidentResult.rows[0];

    const evidenceQuery = `
      SELECT id, incident_id, sample_id, title, description, storage_location,
             collected_by, collected_at, status, kind AS type, file_url, file_hash, file_size, mime_type
      FROM evidence
      WHERE incident_id = $1
      ORDER BY collected_at DESC;
    `;
    const evidenceResult = await pool.query(evidenceQuery, [id]);

    const osintQuery = `
      SELECT id, incident_id, target_type, identifier, latitude, longitude,
             ST_AsGeoJSON(coordinates)::json AS coordinates,
             altitude_m, velocity_mps, logged_at
      FROM osint_tracking_logs
      WHERE incident_id = $1
      ORDER BY logged_at DESC
      LIMIT 50;
    `;
    const osintResult = await pool.query(osintQuery, [id]);

    const auditQuery = `
      SELECT a.id, a.evidence_id, a.action_performed, a.performed_by, a.notes, a.created_at,
             u.email AS user_email, u.full_name AS user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.performed_by = u.id
      LEFT JOIN evidence e ON a.evidence_id = e.id
      WHERE e.incident_id = $1
      ORDER BY a.created_at DESC;
    `;
    const auditResult = await pool.query(auditQuery, [id]).catch(() => ({ rows: [] }));

    res.json({
      status: 'success',
      data: {
        incident,
        evidence: evidenceResult.rows,
        osint_tracking_logs: osintResult.rows,
        audit_history: auditResult.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/incidents', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, severity, status, polygon_coordinates, latitude, longitude } = req.body;
  const created_by = req.user?.id;

  try {
    const geojsonPolygon = polygon_coordinates 
      ? JSON.stringify({ type: 'Polygon', coordinates: [polygon_coordinates] })
      : null;

    const query = `
      INSERT INTO incidents (title, severity, status, created_by, affected_area, location)
      VALUES (
        $1, $2, $3, $4,
        CASE WHEN $5::text IS NOT NULL THEN ST_SetSRID(ST_GeomFromGeoJSON($5), 4326) ELSE NULL END,
        CASE WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL THEN ST_SetSRID(ST_MakePoint($6, $7), 4326) ELSE NULL END
      )
      RETURNING id, title, severity, status, created_by, 
                ST_AsGeoJSON(affected_area)::json AS affected_area,
                ST_AsGeoJSON(location)::json AS location;
    `;

    const result = await pool.query(query, [
      title, 
      severity || 'medium', 
      status || 'open', 
      created_by, 
      geojsonPolygon, 
      longitude ? parseFloat(longitude) : null, 
      latitude ? parseFloat(latitude) : null
    ]);

    const createdIncident = result.rows[0];

    // Emit Realtime Event
    emitRealtimeEvent('INCIDENT_CREATED', createdIncident);

    res.status(201).json({ status: 'success', data: createdIncident });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.patch('/api/incidents/:id', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { severity, status, title, polygon_coordinates, latitude, longitude } = req.body;

  try {
    const geojsonPolygon = polygon_coordinates 
      ? JSON.stringify({ type: 'Polygon', coordinates: [polygon_coordinates] })
      : null;

    const query = `
      UPDATE incidents
      SET 
        severity = COALESCE($1, severity),
        status = COALESCE($2, status),
        title = COALESCE($3, title),
        affected_area = CASE 
          WHEN $4::text IS NOT NULL THEN ST_SetSRID(ST_GeomFromGeoJSON($4), 4326) 
          ELSE affected_area 
        END,
        location = CASE 
          WHEN $5::numeric IS NOT NULL AND $6::numeric IS NOT NULL THEN ST_SetSRID(ST_MakePoint($5, $6), 4326) 
          ELSE location 
        END
      WHERE id = $7
      RETURNING id, title, severity, status, created_by, 
                ST_AsGeoJSON(affected_area)::json AS affected_area,
                ST_AsGeoJSON(location)::json AS location,
                created_at;
    `;

    const result = await pool.query(query, [
      severity || null, 
      status || null, 
      title || null, 
      geojsonPolygon, 
      longitude ? parseFloat(longitude) : null, 
      latitude ? parseFloat(latitude) : null, 
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Incident not found.' });
      return;
    }

    const updatedIncident = result.rows[0];

    // Emit Realtime Event
    emitRealtimeEvent('INCIDENT_UPDATED', updatedIncident);

    res.json({ status: 'success', data: updatedIncident });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// CCTV SURVEILLANCE FEEDS ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/api/cctv', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, camera_name, stream_url, location_name, status,
             ST_AsGeoJSON(location)::json AS location, created_at
      FROM cctv_feeds
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map((row) => ({
        type: 'Feature',
        geometry: row.location,
        properties: {
          id: row.id,
          camera_name: row.camera_name,
          stream_url: row.stream_url,
          location_name: row.location_name,
          status: row.status,
          created_at: row.created_at,
        },
      })),
    };

    res.json({ status: 'success', count: result.rowCount, data: geojson });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/cctv/nearby', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { lng, lat, radiusMeters = 5000 } = req.query;

  if (!lng || !lat) {
    res.status(400).json({ status: 'error', message: 'lng and lat query parameters are required.' });
    return;
  }

  try {
    const query = `
      SELECT id, camera_name, stream_url, location_name, status,
             ST_AsGeoJSON(location)::json AS location,
             ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
      FROM cctv_feeds
      WHERE location IS NOT NULL 
        AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC;
    `;

    const result = await pool.query(query, [parseFloat(lng as string), parseFloat(lat as string), parseFloat(radiusMeters as string)]);
    res.json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/cctv', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { camera_name, stream_url, location_name, status, latitude, longitude } = req.body;

  if (!camera_name || !stream_url || !latitude || !longitude) {
    res.status(400).json({ status: 'error', message: 'camera_name, stream_url, latitude, and longitude are required.' });
    return;
  }

  try {
    const query = `
      INSERT INTO cctv_feeds (camera_name, stream_url, location_name, status, location)
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
      RETURNING id, camera_name, stream_url, location_name, status,
                ST_AsGeoJSON(location)::json AS location, created_at;
    `;

    const result = await pool.query(query, [
      camera_name,
      stream_url,
      location_name || 'Unspecified Location',
      status || 'LIVE',
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// ALERTS CRUD & MANAGEMENT ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/api/alerts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, title, description, source, site_id, incident_id, alert_type, 
             severity, is_read, is_resolved, dedup_key, triggered_at
      FROM alerts 
      ORDER BY triggered_at DESC;
    `;
    const result = await pool.query(query);
    res.json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/alerts', authenticateJWT, authorizeRoles('admin', 'investigator', 'analyst'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, source, site_id, incident_id, alert_type, severity, dedup_key } = req.body;

  try {
    const query = `
      INSERT INTO alerts (title, description, source, site_id, incident_id, alert_type, severity, dedup_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      title || 'System Threat Detected',
      description || 'Automated sensor or spatial threshold breach recorded.',
      source || 'Automated Detector',
      site_id || null,
      incident_id || null,
      alert_type || 'THRESHOLD_BREACH',
      severity || 'warning',
      dedup_key || null,
    ];

    const result = await pool.query(query, values);
    const newAlert = result.rows[0];

    // Emit Realtime Event
    emitRealtimeEvent('ALERT_TRIGGERED', newAlert);

    res.status(201).json({ status: 'success', data: newAlert });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.patch('/api/alerts/read-all', authenticateJWT, authorizeRoles('admin', 'investigator', 'analyst'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      UPDATE alerts
      SET is_read = TRUE
      WHERE is_read = FALSE
      RETURNING id;
    `;
    const result = await pool.query(query);
    res.json({ status: 'success', updatedCount: result.rowCount });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.patch('/api/alerts/:id/read', authenticateJWT, authorizeRoles('admin', 'investigator', 'analyst'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_read = true } = req.body;

  try {
    const query = `
      UPDATE alerts
      SET is_read = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [is_read, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Alert not found.' });
      return;
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.patch('/api/alerts/:id', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_resolved = true } = req.body;

  try {
    const query = `
      UPDATE alerts
      SET is_resolved = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [is_resolved, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Alert not found.' });
      return;
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// CHAIN OF CUSTODY AUDIT LOGS
// -----------------------------------------------------------------------------

app.post('/api/evidence/audit', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { evidence_id, action_performed, notes } = req.body;
  const performed_by = req.user?.id;

  try {
    const query = `
      INSERT INTO audit_logs (evidence_id, action_performed, performed_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [evidence_id, action_performed, performed_by, notes]);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`EFIF Backend active on port ${PORT} with Socket.IO enabled`);
  startThreatDetector(30000);
});