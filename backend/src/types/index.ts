export interface Incident {
  id: string;
  incidentId?: string;
  title: string;
  location: string;
  detected: string;
  status: string;
  investigator?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  lastUpdated?: string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  coordinates?: [number, number];
}