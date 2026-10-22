-- Enable PostGIS extension for GIS geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- 1. AUTHENTICATION & USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'investigator', -- 'admin', 'investigator', 'analyst'
    organization VARCHAR(255) DEFAULT 'EFIF Command Center',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. CORE INCIDENTS & MONITORING SITES
-- ==========================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'open',     -- 'open', 'investigating', 'resolved', 'closed'
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_area GEOMETRY(Polygon, 4326),
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(255) NOT NULL,
    site_type VARCHAR(100) NOT NULL, -- 'Water Sensor', 'Air Quality', 'Weather Station'
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forensic_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES monitoring_sites(id) ON DELETE CASCADE,
    pollutant_type VARCHAR(100) NOT NULL,
    concentration_value NUMERIC(10, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. EVIDENCE & CHAIN OF CUSTODY
-- ==========================================
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    kind VARCHAR(100) NOT NULL, -- 'Drone Imagery', 'Water Sample', 'eDNA', 'Chemical', 'GIS Layer'
    status VARCHAR(50) DEFAULT 'verified',
    description TEXT,
    meta_label VARCHAR(100),
    meta_value VARCHAR(255),
    storage_location VARCHAR(255) DEFAULT 'Locker B-12 (Central Lab)',
    file_url TEXT,
    file_hash VARCHAR(64), -- SHA-256 Checksum
    file_size BIGINT,
    mime_type VARCHAR(100),
    collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
    action_performed VARCHAR(255) NOT NULL, -- E.g., 'EVIDENCE_UPLOADED', 'INTEGRITY_VERIFIED'
    event_type VARCHAR(100),
    performed_by VARCHAR(255) DEFAULT 'System',
    ip_address VARCHAR(45),
    details JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. ALERTS & TELEMETRY
-- ==========================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES monitoring_sites(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'warning', -- 'info', 'warning', 'high', 'critical'
    is_resolved BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. OSINT & SURVEILLANCE MODULE (OSIRIS EXTENSIONS)
-- ==========================================
-- OSINT Tool & Resource Hub Catalog
CREATE TABLE IF NOT EXISTS osint_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'GeoINT', 'Maritime', 'Flight', 'Satellite', 'Chemical Recon'
    description TEXT,
    url TEXT NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'globe',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CCTV & Environmental Surveillance Camera Streams
CREATE TABLE IF NOT EXISTS cctv_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    camera_name VARCHAR(255) NOT NULL,
    stream_url TEXT NOT NULL,
    stream_type VARCHAR(50) DEFAULT 'hls', -- 'hls', 'm3u8', 'jpeg_refresh', 'rtsp'
    location GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',    -- 'active', 'offline', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Live Tracking Logs (OpenSky ADS-B Flights / Vessel AIS Proximity Data)
CREATE TABLE IF NOT EXISTS osint_tracking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'AIRCRAFT', 'VESSEL', 'VEHICLE'
    identifier VARCHAR(100) NOT NULL, -- Callsign, ICAO24, MMSI, Registration
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    coordinates GEOMETRY(Point, 4326),
    altitude_m NUMERIC(10, 2),
    velocity_mps NUMERIC(10, 2),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==========================================
-- Cryptographic integrity index
CREATE INDEX IF NOT EXISTS idx_evidence_file_hash ON evidence(file_hash);

-- PostGIS Spatial GIST Indexes for rapid radius/polygon query performance
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_incidents_affected_area ON incidents USING GIST (affected_area);
CREATE INDEX IF NOT EXISTS idx_monitoring_sites_location ON monitoring_sites USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_cctv_feeds_location ON cctv_feeds USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_osint_tracking_coordinates ON osint_tracking_logs USING GIST (coordinates);