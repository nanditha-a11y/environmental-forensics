import type {
  AlertItem,
  EvidenceItem,
  Integration,
  Kpi,
  MapMarker,
  NotificationItem,
  PlaceholderModule,
  RiskContributor,
  SdgGoal,
  TimelineEvent,
} from '../types';

/* ------------------------------------------------------------------ */
/*  KPI cards                                                          */
/* ------------------------------------------------------------------ */

export const kpis: Kpi[] = [
  { id: 'incidents', label: 'Total Incidents', value: 24, delta: '18% this month', icon: 'leaf', accent: 'emerald', spark: [6, 8, 7, 9, 12, 11, 14, 16, 15, 19, 22, 24] },
  { id: 'active', label: 'Active Investigations', value: 7, delta: '12% this month', icon: 'scale', accent: 'amber', spark: [4, 4, 5, 5, 4, 6, 5, 6, 6, 7, 6, 7] },
  { id: 'evidence', label: 'Evidence Collected', value: 156, delta: '23% this month', icon: 'file-stack', accent: 'sky', spark: [42, 51, 58, 66, 74, 85, 92, 104, 118, 127, 141, 156] },
  { id: 'alerts', label: 'High Risk Alerts', value: 5, delta: '40% this month', icon: 'alert', accent: 'violet', spark: [1, 1, 2, 1, 2, 2, 3, 2, 3, 4, 3, 5] },
  { id: 'resolved', label: 'Resolved Cases', value: 12, delta: '8% this month', icon: 'check', accent: 'cyan', spark: [4, 5, 4, 6, 6, 7, 8, 8, 9, 10, 11, 12] },
];

/* ------------------------------------------------------------------ */
/*  Incident map markers                                               */
/* ------------------------------------------------------------------ */

export const mapMarkers: MapMarker[] = [
  { id: 'm1', incidentId: 'EFIF-0017', type: 'high', x: 47, y: 40, title: 'Suspected Illegal Discharge', risk: 'HIGH', detected: '17 Aug 2026, 10:32 AM', status: 'Under Investigation' },
  { id: 'm2', incidentId: 'EFIF-0014', type: 'medium', x: 60, y: 54, title: 'Deforestation — Protected Area', risk: 'MEDIUM', detected: '16 Aug 2026, 09:10 AM', status: 'Evidence Review' },
  { id: 'm3', incidentId: 'EFIF-0011', type: 'low', x: 72, y: 68, title: 'Waste Dumping — Buffer Zone', risk: 'LOW', detected: '15 Aug 2026, 04:22 PM', status: 'Monitoring' },
  { id: 'm4', incidentId: 'EFIF-0017', type: 'sample', x: 36, y: 33, title: 'Water Sampling Site R-3', risk: 'MEDIUM', detected: '17 Aug 2026, 12:20 PM', status: 'Sample Collected' },
  { id: 'm5', incidentId: 'EFIF-0017', type: 'drone', x: 64, y: 26, title: 'Drone Survey Grid D-2', risk: 'LOW', detected: '17 Aug 2026, 11:05 AM', status: 'Survey Complete' },
  { id: 'm6', incidentId: 'EFIF-0015', type: 'medium', x: 26, y: 62, title: 'Industrial Effluent — Storm Drain', risk: 'MEDIUM', detected: '16 Aug 2026, 02:40 PM', status: 'Investigation Open' },
];

/* ------------------------------------------------------------------ */
/*  Alerts                                                             */
/* ------------------------------------------------------------------ */

export const alerts: AlertItem[] = [
  {
    id: 'AL-1042',
    severity: 'high',
    title: 'High pollutant detected in Vrishabhavati River',
    time: '18 Aug 2026, 03:20 PM',
    source: 'Sensor Network · pH/COD Anomaly',
    detail: 'COD concentration at sampling site R-3 measured 184 mg/L — 3.7× above the permitted discharge standard. Colour anomalies confirmed by drone multispectral pass.',
    action: 'Escalate to laboratory confirmation and notify the Karnataka State Pollution Control Board contact.',
  },
  {
    id: 'AL-1041',
    severity: 'medium',
    title: 'New deforestation detected in protected area',
    time: '18 Aug 2026, 11:15 AM',
    source: 'Satellite · Change Detection',
    detail: 'Automated change detection flagged a 0.8 ha canopy loss inside the protected boundary between two weekly satellite passes. High-resolution drone verification recommended.',
    action: 'Task a drone survey and compare against the historical land-cover baseline.',
  },
  {
    id: 'AL-1040',
    severity: 'medium',
    title: 'Wildlife trafficking suspect movement detected',
    time: '17 Aug 2026, 09:40 PM',
    source: 'GIS · Movement Corridor Analysis',
    detail: 'Night-time movement pattern correlated with a known trafficking corridor within 4 km of the incident zone. Timestamped GPS trail linked to two vehicle registrations.',
    action: 'Share corridor intelligence with enforcement partners; do not broadcast publicly.',
  },
];

/* ------------------------------------------------------------------ */
/*  Investigation timeline (EFIF-0017)                                 */
/* ------------------------------------------------------------------ */

export const timelineEvents: TimelineEvent[] = [
  { id: 't1', time: '10:32 AM', title: 'Satellite anomaly detected', detail: 'Multispectral pass flagged turbidity plume at river confluence', icon: 'satellite' },
  { id: 't2', time: '11:05 AM', title: 'Drone survey conducted', detail: 'Grid D-2 captured 214 ortho images, 4 cm ground resolution', icon: 'drone' },
  { id: 't3', time: '12:20 PM', title: 'Water sample collected', detail: 'Site R-3 · three samples sealed and logged into chain of custody', icon: 'droplets' },
  { id: 't4', time: '02:15 PM', title: 'Chemical analysis uploaded', detail: 'pH 6.1 · COD 184 mg/L · chromium elevated above guideline', icon: 'flask' },
  { id: 't5', time: '04:00 PM', title: 'AI evidence fusion completed', detail: 'Satellite, drone, sensor and lab layers correlated across 6 sources', icon: 'brain' },
  { id: 't6', time: '04:05 PM', title: 'High risk alert generated', detail: 'Composite risk score 87/100 — investigation escalated', icon: 'bell' },
];

/* ------------------------------------------------------------------ */
/*  Evidence summary                                                   */
/* ------------------------------------------------------------------ */

export const evidenceItems: EvidenceItem[] = [
  {
    id: 'ev-1',
    title: 'Drone Imagery',
    kind: 'drone',
    meta: 'Collected',
    metaValue: '17 Aug 2026',
    status: 'Uploaded',
    description: 'Orthomosaic and multispectral imagery from drone survey grid D-2 over the Vrishabhavati river corridor. Captures the turbidity plume and discharge outlet in visible, NIR and thermal bands.',
    details: [
      { label: 'Survey grid', value: 'D-2 · 1.2 km²' },
      { label: 'Frames', value: '214 ortho · 38 thermal' },
      { label: 'Resolution', value: '4 cm / pixel' },
      { label: 'Sensor', value: 'DJI M300 · H20T' },
      { label: 'Chain of custody', value: 'Verified · DroneOps' },
    ],
    actionLabel: 'View Report →',
  },
  {
    id: 'ev-2',
    title: 'Water Sample',
    kind: 'water',
    meta: 'Collected',
    metaValue: '17 Aug 2026',
    status: 'Uploaded',
    description: 'Three grab samples collected at site R-3, 200 m downstream of the suspected discharge point. Sealed under chain-of-custody protocol and transported chilled to the forensic laboratory.',
    details: [
      { label: 'Sample IDs', value: 'R3-01 · R3-02 · R3-03' },
      { label: 'Depth', value: '0.3 m surface grab' },
      { label: 'Preservation', value: 'H₂SO₄ / 4°C chilled' },
      { label: 'Collected by', value: 'Field Unit · EFIF' },
      { label: 'Chain of custody', value: 'Sealed · COC-2217' },
    ],
  },
  {
    id: 'ev-3',
    title: 'eDNA Analysis',
    kind: 'dna',
    meta: 'Collected',
    metaValue: '18 Aug 2026',
    status: 'Uploaded',
    description: 'Environmental DNA metabarcoding of the water samples to profile aquatic biodiversity and detect stress indicators. Preliminary reads suggest a shift in benthic community composition near the outlet.',
    details: [
      { label: 'Marker', value: 'COI · 12S (fish panel)' },
      { label: 'Reads', value: '1.4 M paired-end' },
      { label: 'OTUs detected', value: '87 taxa' },
      { label: 'Lab', value: 'EFIF eDNA Lab · Bengaluru' },
      { label: 'Status', value: 'Analysis complete' },
    ],
  },
  {
    id: 'ev-4',
    title: 'Chemical Analysis',
    kind: 'lab',
    meta: 'Status',
    metaValue: 'Completed',
    status: 'Completed',
    description: 'Full physicochemical and trace-metal panel for samples R3-01 to R3-03. COD and chromium exceed the surface-water discharge standard; results are consistent with untreated industrial effluent.',
    details: [
      { label: 'pH', value: '6.1 (guideline 6.5–8.5)' },
      { label: 'COD', value: '184 mg/L · 3.7× limit' },
      { label: 'Chromium (VI)', value: '0.14 mg/L · elevated' },
      { label: 'Suspended solids', value: '612 mg/L' },
      { label: 'Lab', value: 'EFIF Forensic Lab' },
    ],
    chart: [
      { label: 'pH', value: 6.1 },
      { label: 'COD', value: 184 },
      { label: 'Cr', value: 14 },
      { label: 'TSS', value: 612 },
      { label: 'BOD', value: 96 },
    ],
    chartKind: 'bar',
    actionLabel: 'View Report →',
  },
  {
    id: 'ev-5',
    title: 'GIS Layers',
    kind: 'gis',
    meta: 'Status',
    metaValue: 'Updated',
    status: 'Updated',
    description: 'Integrated spatial layers — river network, land ownership, protected-area boundaries, drainage outfalls and the historical pollution baseline — fused into the investigation workspace.',
    details: [
      { label: 'Layers', value: '12 active' },
      { label: 'Baseline', value: '2010–2025 archive' },
      { label: 'Ownership', value: 'BDA / private parcels' },
      { label: 'Projection', value: 'UTM 43N · WGS84' },
      { label: 'Updated', value: '18 Aug 2026, 09:00 AM' },
    ],
    actionLabel: 'View Layer →',
  },
  {
    id: 'ev-6',
    title: 'Historical Data',
    kind: 'history',
    meta: 'Status',
    metaValue: 'Available',
    status: 'Available',
    description: 'Time-series of water quality, rainfall and land-use records for the catchment over the past 15 years. Supports trend attribution and demonstrates whether current readings deviate from seasonal norms.',
    details: [
      { label: 'Records', value: '5,412 station-days' },
      { label: 'Span', value: '2010 – 2026' },
      { label: 'Stations', value: '9 monitoring points' },
      { label: 'Sources', value: 'CPCB · KSPCB · EFIF' },
      { label: 'Format', value: 'CSV · NetCDF · API' },
    ],
    chart: [
      { label: '2018', value: 62 },
      { label: '2019', value: 71 },
      { label: '2020', value: 58 },
      { label: '2021', value: 84 },
      { label: '2022', value: 79 },
      { label: '2023', value: 96 },
      { label: '2024', value: 88 },
      { label: '2025', value: 118 },
      { label: '2026', value: 146 },
    ],
    chartKind: 'area',
    actionLabel: 'View Data →',
  },
];

/* ------------------------------------------------------------------ */
/*  Platform integrations                                              */
/* ------------------------------------------------------------------ */

export const integrations: Integration[] = [
  { id: 'i1', name: 'Satellite', icon: 'satellite', status: 'Connected' },
  { id: 'i2', name: 'Drone', icon: 'drone', status: 'Connected' },
  { id: 'i3', name: 'eDNA Lab', icon: 'dna', status: 'Connected' },
  { id: 'i4', name: 'Sensors', icon: 'radio', status: 'Connected' },
  { id: 'i5', name: 'AI Engine', icon: 'brain', status: 'Active' },
  { id: 'i6', name: 'GIS Engine', icon: 'globe', status: 'Active' },
];

/* ------------------------------------------------------------------ */
/*  AI risk contributors                                               */
/* ------------------------------------------------------------------ */

export const riskContributors: RiskContributor[] = [
  { label: 'Chemical Anomaly', value: 30, color: 'from-red-400 to-rose-500' },
  { label: 'Drone Detection', value: 20, color: 'from-amber-400 to-orange-500' },
  { label: 'Biodiversity eDNA', value: 15, color: 'from-cyan-400 to-sky-500' },
  { label: 'GIS Proximity', value: 15, color: 'from-sky-400 to-blue-500' },
  { label: 'Historical Data', value: 7, color: 'from-violet-400 to-purple-500' },
  { label: 'Other Factors', value: 13, color: 'from-slate-400 to-slate-500' },
];

/* ------------------------------------------------------------------ */
/*  Notifications (top bar bell)                                       */
/* ------------------------------------------------------------------ */

export const notifications: NotificationItem[] = [
  { id: 'n1', severity: 'high', title: 'High pollutant detected in Vrishabhavati River', time: '18 Aug 2026, 03:20 PM', unread: true },
  { id: 'n2', severity: 'medium', title: 'New deforestation detected in protected area', time: '18 Aug 2026, 11:15 AM', unread: true },
  { id: 'n3', severity: 'medium', title: 'Wildlife trafficking suspect movement detected', time: '17 Aug 2026, 09:40 PM', unread: true },
];

/* ------------------------------------------------------------------ */
/*  SDG panel                                                          */
/* ------------------------------------------------------------------ */

export const sdgGoals: SdgGoal[] = [
  { number: '13', name: 'Climate Action', icon: 'sprout', blurb: 'Strengthen resilience and adaptive capacity' },
  { number: '15', name: 'Life on Land', icon: 'trees', blurb: 'Protect, restore and sustainably manage ecosystems' },
  { number: '16', name: 'Peace, Justice & Strong Institutions', icon: 'scale', blurb: 'Accountable institutions and rule of law' },
];

/* ------------------------------------------------------------------ */
/*  Placeholder modules                                                */
/* ------------------------------------------------------------------ */

export const placeholderModules: PlaceholderModule[] = [
  {
    key: 'incidents',
    path: '/incidents',
    title: 'Incidents',
    subtitle: 'Case management and investigation tracking',
    icon: 'incidents',
    description: 'This module will consolidate every environmental incident — from initial detection to case resolution — with full case files, investigators, evidence linkage and status workflows.',
    chips: ['Case registry', 'Investigator assignment', 'Severity triage', 'Resolution workflow'],
  },
  {
    key: 'map',
    path: '/map',
    title: 'Map & GIS',
    subtitle: 'Spatial intelligence across the incident theatre',
    icon: 'map',
    description: 'This module will connect environmental evidence to a full GIS workspace — satellite mosaics, drone orthomosaics, sensor telemetry and historical land-use layers in a single spatial view.',
    chips: ['Satellite mosaics', 'Drone orthomosaics', 'Sensor telemetry', 'Historical land-use'],
  },
  {
    key: 'evidence',
    path: '/evidence',
    title: 'Evidence Vault',
    subtitle: 'Chain-of-custody evidence management',
    icon: 'vault',
    description: 'This module will be the forensic vault for every piece of environmental evidence — imagery, samples, lab results and eDNA profiles — with immutable chain-of-custody records.',
    chips: ['Immutable custody log', 'Sample registry', 'Lab result linking', 'eDNA profiles'],
  },
  {
    key: 'sources',
    path: '/sources',
    title: 'Data Sources',
    subtitle: 'Connected technologies and data feeds',
    icon: 'sources',
    description: 'This module will manage the integration layer that makes EFIF possible — the satellites, drones, sensors, laboratories and AI engines feeding one intelligence platform.',
    chips: ['Satellite feeds', 'Drone fleet', 'Sensor network', 'Lab integrations'],
  },
  {
    key: 'analytics',
    path: '/analytics',
    title: 'Analytics & AI',
    subtitle: 'Evidence correlation and environmental intelligence',
    icon: 'analytics',
    description: 'This module will connect environmental evidence and AI-assisted investigation workflows — pattern detection, anomaly scoring and cross-source correlation across the whole case archive.',
    chips: ['Anomaly detection', 'Cross-source fusion', 'Predictive modelling', 'Explainable scores'],
  },
  {
    key: 'reports',
    path: '/reports',
    title: 'Reports',
    subtitle: 'Investigation and compliance reporting',
    icon: 'reports',
    description: 'This module will turn case evidence into structured investigation reports, regulatory submissions and executive briefings — reproducible and timestamped.',
    chips: ['Investigation reports', 'Regulatory filing', 'Executive briefings', 'Export & archive'],
  },
  {
    key: 'alerts',
    path: '/alerts',
    title: 'Alerts',
    subtitle: 'Real-time environmental threat notification',
    icon: 'alerts',
    description: 'This module will manage the alert stream — detection events from satellites, drones, sensors and AI fusion, with severity triage, acknowledgment and escalation.',
    chips: ['Detection events', 'Severity triage', 'Acknowledgment', 'Escalation'],
  },
  {
    key: 'users',
    path: '/users',
    title: 'Users & Roles',
    subtitle: 'Access control for the investigation team',
    icon: 'users',
    description: 'This module will manage investigators, analysts and laboratory staff — role-based access to cases, evidence and reports across the organization.',
    chips: ['Role-based access', 'Organization groups', 'Activity audit', 'Approvals'],
  },
  {
    key: 'settings',
    path: '/settings',
    title: 'Settings',
    subtitle: 'Platform configuration and preferences',
    icon: 'settings',
    description: 'This module will hold platform configuration — data source credentials, alert thresholds, integration health and organization preferences.',
    chips: ['Integration health', 'Alert thresholds', 'Data retention', 'Organization profile'],
  },
];

/* ------------------------------------------------------------------ */
/*  Featured incident                                                  */
/* ------------------------------------------------------------------ */

export const featuredIncident = {
  id: 'EFIF-0017',
  title: 'Suspected Illegal Discharge into River',
  location: 'Hosur Main Road, Bengaluru, Karnataka',
  detected: '17 Aug 2026, 10:32 AM',
  status: 'Under Investigation',
  investigator: 'Bhargav K.',
  priority: 'High',
  lastUpdated: '17 Aug 2026, 04:45 PM',
  riskScore: 87,
  riskLabel: 'HIGH' as const,
};

export const authRoles = ['Investigator', 'Environmental Analyst', 'Laboratory Analyst'] as const;
