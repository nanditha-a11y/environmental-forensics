import express, { Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';
import { hashPassword, comparePassword, generateToken } from './utils/auth';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// -----------------------------------------------------------------------------

app.post('/api/auth/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    res.status(400).json({ status: 'error', message: 'Full name, email, and password are required.' });
    return;
  }

  try {
    const hashedPassword = await hashPassword(password);
    const assignedRole = role || 'investigator';

    const query = `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role, created_at;
    `;

    const result = await pool.query(query, [full_name, email, hashedPassword, assignedRole]);
    const user = result.rows[0];

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ status: 'success', token, user });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ status: 'error', message: 'Email already exists.' });
      return;
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/auth/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    return;
  }

  try {
    const query = `SELECT * FROM users WHERE email = $1;`;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

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
// WEEK 3: INCIDENTS CRUD & SPATIAL RADIUS ROUTES
// -----------------------------------------------------------------------------

// GET all incidents (GeoJSON output with point location & polygon affected area)
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

// GET /api/incidents/radius - Find incidents within a radius (meters) of lat/lng
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

// POST new incident with Point & optional Polygon geometry (JWT Protected: Admin / Investigator)
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

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PATCH update incident status / severity (JWT Protected: Admin / Investigator)
app.patch('/api/incidents/:id', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { severity, status } = req.body;

  try {
    const query = `
      UPDATE incidents
      SET severity = COALESCE($1, severity),
          status = COALESCE($2, status)
      WHERE id = $3
      RETURNING id, title, severity, status, created_by, 
                ST_AsGeoJSON(affected_area)::json AS affected_area,
                ST_AsGeoJSON(location)::json AS location;
    `;

    const result = await pool.query(query, [severity, status, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Incident not found.' });
      return;
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// ALERTS CRUD ROUTES (GET, POST, PATCH)
// -----------------------------------------------------------------------------

app.get('/api/alerts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `SELECT * FROM alerts ORDER BY triggered_at DESC;`;
    const result = await pool.query(query);
    res.json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/alerts', authenticateJWT, authorizeRoles('admin', 'investigator', 'analyst'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { site_id, alert_type, severity } = req.body;

  try {
    const query = `
      INSERT INTO alerts (site_id, alert_type, severity)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [site_id, alert_type, severity || 'warning']);
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.patch('/api/alerts/:id', authenticateJWT, authorizeRoles('admin', 'investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_resolved } = req.body;

  try {
    const query = `
      UPDATE alerts
      SET is_resolved = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [is_resolved !== undefined ? is_resolved : true, id]);

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

app.listen(PORT, () => {
  console.log(`EFIF Backend active on port ${PORT}`);
});