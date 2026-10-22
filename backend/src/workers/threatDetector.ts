import { pool } from '../db';
import { emitRealtimeEvent } from '../socket';

/**
 * Runs automated threat detection rules against live flight logs and sensor readings.
 */
export async function runThreatDetection(): Promise<{ alertsTriggered: number }> {
  let alertsTriggered = 0;

  try {
    // -------------------------------------------------------------------------
    // RULE 1: Aircraft Spatial Intrusion into Incident Area
    // -------------------------------------------------------------------------
    const flightIncursionQuery = `
      SELECT 
        t.identifier AS callsign,
        t.latitude,
        t.longitude,
        i.id AS incident_id,
        i.title AS incident_title,
        i.severity AS incident_severity
      FROM osint_tracking_logs t
      JOIN incidents i ON (
        (i.affected_area IS NOT NULL AND ST_Contains(i.affected_area, t.coordinates))
        OR (i.location IS NOT NULL AND ST_DWithin(i.location::geography, t.coordinates::geography, 2000))
      )
      WHERE t.target_type = 'AIRCRAFT'
        AND t.detected_at >= NOW() - INTERVAL '15 minutes'
        AND i.status != 'closed' AND i.status != 'resolved';
    `;

    const flightIncursions = await pool.query(flightIncursionQuery);

    for (const incursion of flightIncursions.rows) {
      // Hour-based deduplication key for flight incursions
      const dedupKey = `FLIGHT_INTRUSION_${incursion.callsign}_${incursion.incident_id}_${new Date().toISOString().slice(0, 13)}`;

      const existingAlert = await pool.query(
        'SELECT id FROM alerts WHERE dedup_key = $1 AND triggered_at >= NOW() - INTERVAL \'1 hour\'',
        [dedupKey]
      );

      if (existingAlert.rows.length === 0) {
        const alertInsert = `
          INSERT INTO alerts (title, description, source, incident_id, alert_type, severity, dedup_key)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const alertResult = await pool.query(alertInsert, [
          `Flight Perimeter Breach: ${incursion.callsign}`,
          `Aircraft ${incursion.callsign} detected inside restricted area for incident "${incursion.incident_title}".`,
          `ADS-B Spatial Threat Detector`,
          incursion.incident_id,
          `FLIGHT_INTRUSION`,
          incursion.incident_severity === 'critical' ? 'critical' : 'high',
          dedupKey,
        ]);

        const newAlert = alertResult.rows[0];
        emitRealtimeEvent('ALERT_TRIGGERED', newAlert);
        alertsTriggered++;
      }
    }

    // -------------------------------------------------------------------------
    // RULE 2: Forensic Sensor Anomaly & Threshold Exceeded
    // -------------------------------------------------------------------------
    const sensorBreachQuery = `
      SELECT 
        s.id AS sample_id,
        s.pollutant_type,
        s.concentration_value,
        s.unit,
        m.id AS site_id,
        m.site_name
      FROM forensic_samples s
      JOIN monitoring_sites m ON s.site_id = m.id
      WHERE (s.is_anomaly = TRUE OR s.concentration_value > 50.0)
        AND s.created_at >= NOW() - INTERVAL '30 minutes';
    `;

    const sensorBreaches = await pool.query(sensorBreachQuery);

    for (const breach of sensorBreaches.rows) {
      const dedupKey = `SENSOR_BREACH_${breach.sample_id}`;

      const existingAlert = await pool.query(
        'SELECT id FROM alerts WHERE dedup_key = $1',
        [dedupKey]
      );

      if (existingAlert.rows.length === 0) {
        const severity = Number(breach.concentration_value) > 100 ? 'critical' : 'warning';
        const alertInsert = `
          INSERT INTO alerts (title, description, source, site_id, alert_type, severity, dedup_key)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const alertResult = await pool.query(alertInsert, [
          `Sensor Threshold Exceeded: ${breach.pollutant_type}`,
          `Critical concentration (${breach.concentration_value} ${breach.unit}) recorded at ${breach.site_name}.`,
          `Environmental Sensor Telemetry`,
          breach.site_id,
          `THRESHOLD_BREACH`,
          severity,
          dedupKey,
        ]);

        const newAlert = alertResult.rows[0];
        emitRealtimeEvent('ALERT_TRIGGERED', newAlert);
        alertsTriggered++;
      }
    }
  } catch (error: any) {
    console.error('Error running automated threat detector worker:', error.message);
  }

  return { alertsTriggered };
}

/**
 * Initializes the background interval worker.
 */
export function startThreatDetector(intervalMs = 30000): NodeJS.Timeout {
  console.log(`📡 Automated Threat Detector active (running every ${intervalMs / 1000}s)`);

  // Run initial pass on server startup
  runThreatDetection().catch((err) => console.error('Initial threat detection run failed:', err));

  // Schedule periodic checks
  return setInterval(() => {
    runThreatDetection().catch((err) => console.error('Scheduled threat detection run failed:', err));
  }, intervalMs);
}