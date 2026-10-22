export type Severity = 'high' | 'medium' | 'low';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Kpi {
  id: string;
  label: string;
  value: number;
  delta: string;
  icon: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet' | 'cyan';
  spark: number[];
}

export type MarkerType = 'high' | 'medium' | 'low' | 'sample' | 'drone';

export interface MapMarker {
  id: string;
  incidentId: string;
  type: MarkerType;
  x: number;
  y: number;
  title: string;
  risk: RiskLevel;
  detected: string;
  status: string;
}

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  time: string;
  source: string;
  detail: string;
  action: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  icon: string;
}

export type EvidenceKind = 'drone' | 'water' | 'dna' | 'lab' | 'gis' | 'history' | string;

export interface EvidenceItem {
  id: string;
  title: string;
  kind: EvidenceKind;
  meta?: string;
  metaValue?: string;
  status?: string;
  description?: string;
  details?: { label: string; value: string }[];
  chart?: { label: string; value: number }[];
  chartKind?: 'area' | 'bar';
  actionLabel?: string;
  file_url?: string | null;
  file_hash?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationResult {
  id: string;
  storedHash: string;
  computedHash: string;
  status: 'VERIFIED' | 'TAMPERED';
  isIntegrityIntact: boolean;
  verifiedAt: string;
}

export interface AuditLogEntry {
  id: string;
  evidence_id: string;
  action: string;
  performed_by: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  status: 'Connected' | 'Active';
}

export interface RiskContributor {
  label: string;
  value: number;
  color: string;
}

export interface NotificationItem {
  id: string;
  severity: Severity;
  title: string;
  time: string;
  unread: boolean;
}

export interface SdgGoal {
  number: string;
  name: string;
  icon: string;
  blurb: string;
}

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  organization: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  organization: string;
  role: string;
}

export interface PlaceholderModule {
  key: string;
  path: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  chips: string[];
}