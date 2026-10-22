import { pool } from '../db';

export interface AuditLogParams {
  evidenceId: string;
  action: 'EVIDENCE_UPLOADED' | 'INTEGRITY_VERIFIED' | 'TAMPER_DETECTED' | 'EVIDENCE_DELETED';
  performedBy?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAuditEvent({
  evidenceId,
  action,
  performedBy = 'SYSTEM',
  details = {},
  ipAddress = undefined,
}: AuditLogParams): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_logs (evidence_id, event_type, performed_by, details, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [
      evidenceId,
      action,
      performedBy,
      JSON.stringify(details),
      ipAddress || null,
    ]);
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
}