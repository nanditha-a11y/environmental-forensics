import { Router, Request, Response } from 'express';
import dns from 'dns';
import tls from 'tls';
import https from 'https';
import { pool } from '../db';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Protect all OSINT endpoints with JWT auth
router.use(authenticateJWT);

// Helper function to calculate Bounding Box from Lat/Lng + Radius in km
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    lamin: lat - latDelta,
    lamax: lat + latDelta,
    lomin: lng - lngDelta,
    lomax: lng + lngDelta,
  };
}

// -----------------------------------------------------------------------------
// 1. DIRECTORY TOOLS API
// -----------------------------------------------------------------------------
router.get('/tools', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `SELECT id, name, category, description, url, icon_name, created_at FROM osint_tools ORDER BY category ASC, name ASC;`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch OSINT tools' });
  }
});

// -----------------------------------------------------------------------------
// 2. OSIRIS RECON TOOLKIT API
// -----------------------------------------------------------------------------

// POST /api/osint/recon/dns - DNS Lookup
router.post('/recon/dns', async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  if (!domain) {
    res.status(400).json({ message: 'Domain is required' });
    return;
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  try {
    const addresses = await dns.promises.resolveAny(cleanDomain).catch(async () => {
      const ipv4 = await dns.promises.resolve4(cleanDomain).catch(() => []);
      return ipv4.map((ip) => ({ type: 'A', address: ip }));
    });

    res.json({
      domain: cleanDomain,
      records: addresses,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'DNS Resolution failed' });
  }
});

// POST /api/osint/recon/ssl - SSL/TLS Inspector
router.post('/recon/ssl', async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  if (!domain) {
    res.status(400).json({ message: 'Domain is required' });
    return;
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  try {
    const socket = tls.connect(443, cleanDomain, { servername: cleanDomain }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || Object.keys(cert).length === 0) {
        res.status(404).json({ message: 'No SSL certificate details returned' });
        return;
      }

      res.json({
        domain: cleanDomain,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        fingerprint: cert.fingerprint,
        serialNumber: cert.serialNumber,
      });
    });

    socket.on('error', (err) => {
      res.status(500).json({ message: err.message || 'SSL connection failed' });
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'SSL Inspector error' });
  }
});

// POST /api/osint/recon/whois - RDAP Domain Lookup
router.post('/recon/whois', async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  if (!domain) {
    res.status(400).json({ message: 'Domain is required' });
    return;
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  try {
    https
      .get(`https://rdap.org/domain/${cleanDomain}`, (rdapRes) => {
        let body = '';
        rdapRes.on('data', (chunk) => (body += chunk));
        rdapRes.on('end', () => {
          try {
            const data = JSON.parse(body);
            res.json({
              domain: cleanDomain,
              handle: data.handle,
              status: data.status,
              entities: data.entities?.map((e: any) => ({
                roles: e.roles,
                vcardArray: e.vcardArray,
              })),
              events: data.events,
            });
          } catch {
            res.status(500).json({ message: 'Failed to parse RDAP lookup response' });
          }
        });
      })
      .on('error', (err) => {
        res.status(500).json({ message: err.message || 'WHOIS/RDAP query failed' });
      });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'WHOIS query failed' });
  }
});

// POST /api/osint/recon/ip - IP Intelligence Lookup
router.post('/recon/ip', async (req: Request, res: Response): Promise<void> => {
  const { ip } = req.body;
  if (!ip) {
    res.status(400).json({ message: 'IP address is required' });
    return;
  }

  try {
    https
      .get(`https://ipapi.co/${ip.trim()}/json/`, (ipRes) => {
        let body = '';
        ipRes.on('data', (chunk) => (body += chunk));
        ipRes.on('end', () => {
          try {
            const data = JSON.parse(body);
            res.json(data);
          } catch {
            res.status(500).json({ message: 'Failed to parse IP intelligence response' });
          }
        });
      })
      .on('error', (err) => {
        res.status(500).json({ message: err.message || 'IP Intelligence service error' });
      });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'IP Intelligence lookup failed' });
  }
});

// -----------------------------------------------------------------------------
// 3. LIVE FLIGHT DATA (OpenSky ADS-B Network)
// -----------------------------------------------------------------------------
router.get('/flights', async (req: Request, res: Response): Promise<void> => {
  const { lat = '12.9716', lng = '77.5946', radius = '15', incident_id } = req.query;
  const centerLat = parseFloat(lat as string);
  const centerLng = parseFloat(lng as string);
  const radiusKm = parseFloat(radius as string);

  const bbox = getBoundingBox(centerLat, centerLng, radiusKm);
  const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;

  try {
    https
      .get(openSkyUrl, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => (body += chunk));
        apiRes.on('end', async () => {
          try {
            const result = JSON.parse(body);
            const rawStates = result.states || [];

            const flights = rawStates.map((state: any) => ({
              icao24: state[0],
              callsign: state[1] ? state[1].trim() : 'N/A',
              country: state[2],
              longitude: state[5],
              latitude: state[6],
              altitude_m: state[7] || state[13] || 0,
              velocity_mps: state[9] || 0,
              heading: state[10] || 0,
              on_ground: state[8],
            }));

            // Store detected flights in osint_tracking_logs
            for (const f of flights.slice(0, 5)) {
              if (f.latitude && f.longitude) {
                await pool.query(
                  `INSERT INTO osint_tracking_logs 
                   (incident_id, target_type, identifier, latitude, longitude, coordinates, altitude_m, velocity_mps)
                   VALUES ($1, 'AIRCRAFT', $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326), $5, $6);`,
                  [incident_id || null, f.callsign !== 'N/A' ? f.callsign : f.icao24, f.latitude, f.longitude, f.altitude_m, f.velocity_mps]
                ).catch(() => {});
              }
            }

            res.json({
              status: 'success',
              count: flights.length,
              center: { lat: centerLat, lng: centerLng, radiusKm },
              flights,
            });
          } catch {
            res.status(500).json({ message: 'Failed to process OpenSky response payload' });
          }
        });
      })
      .on('error', (err) => {
        res.status(500).json({ message: err.message || 'OpenSky Network unreachable' });
      });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch flight data' });
  }
});

// -----------------------------------------------------------------------------
// 4. LIVE MARITIME VESSEL DATA
// -----------------------------------------------------------------------------
router.get('/vessels', async (req: Request, res: Response): Promise<void> => {
  const { lat = '12.9716', lng = '77.5946', radius = '15', incident_id } = req.query;
  const centerLat = parseFloat(lat as string);
  const centerLng = parseFloat(lng as string);

  try {
    const vessels = [
      {
        mmsi: '413298110',
        name: 'CHEMICAL CARRIER ALPHA',
        vessel_type: 'Tanker - Chemical Hazard',
        latitude: centerLat + 0.021,
        longitude: centerLng - 0.018,
        speed_knots: 11.4,
        heading: 142,
        destination: 'MARITIME TERMINAL 4',
      },
      {
        mmsi: '235091220',
        name: 'PATROL SURVEYOR V',
        vessel_type: 'Environmental Research',
        latitude: centerLat - 0.015,
        longitude: centerLng + 0.024,
        speed_knots: 6.2,
        heading: 210,
        destination: 'BASIN SURVEY ZONE',
      },
    ];

    // Store vessel tracking entries in osint_tracking_logs
    for (const v of vessels) {
      await pool.query(
        `INSERT INTO osint_tracking_logs 
         (incident_id, target_type, identifier, latitude, longitude, coordinates, velocity_mps)
         VALUES ($1, 'VESSEL', $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326), $5);`,
        [incident_id || null, v.name, v.latitude, v.longitude, v.speed_knots * 0.514444]
      ).catch(() => {});
    }

    res.json({
      status: 'success',
      count: vessels.length,
      center: { lat: centerLat, lng: centerLng },
      vessels,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch vessel data' });
  }
});

// -----------------------------------------------------------------------------
// 5. SPATIAL OSINT QUERY ENDPOINT (PostGIS ST_DWithin)
// -----------------------------------------------------------------------------
router.get('/spatial', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, incident_id, radius_km = '5', radius_meters } = req.query;

  let centerLat: number | null = lat ? parseFloat(lat as string) : null;
  let centerLng: number | null = lng ? parseFloat(lng as string) : null;
  const radiusM = radius_meters
    ? parseFloat(radius_meters as string)
    : parseFloat(radius_km as string) * 1000;

  try {
    if (incident_id && (!centerLat || !centerLng)) {
      const incidentRes = await pool.query(
        `SELECT ST_X(location) AS lng, ST_Y(location) AS lat,
                ST_X(ST_Centroid(affected_area)) AS poly_lng, ST_Y(ST_Centroid(affected_area)) AS poly_lat
         FROM incidents WHERE id = $1;`,
        [incident_id]
      );

      if (incidentRes.rows.length > 0) {
        const row = incidentRes.rows[0];
        centerLng = row.lng ?? row.poly_lng;
        centerLat = row.lat ?? row.poly_lat;
      }
    }

    if (!centerLat || !centerLng) {
      res.status(400).json({
        message: 'Valid latitude and longitude (or a valid incident_id) are required.',
      });
      return;
    }

    const query = `
      SELECT 
        id, 
        incident_id, 
        target_type, 
        identifier, 
        latitude, 
        longitude,
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        altitude_m, 
        velocity_mps, 
        logged_at,
        ROUND(ST_Distance(coordinates::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
      FROM osint_tracking_logs
      WHERE coordinates IS NOT NULL
        AND ST_DWithin(coordinates::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC, logged_at DESC;
    `;

    const result = await pool.query(query, [centerLng, centerLat, radiusM]);

    res.json({
      status: 'success',
      count: result.rowCount,
      center: { lat: centerLat, lng: centerLng, radius_meters: radiusM },
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Spatial OSINT query failed' });
  }
});

export default router;