import { pool } from './db';

const defaultTools = [
  // CybDetective & General Maps
  {
    name: 'CybDetective OSINT World Map',
    category: 'GeoINT',
    description: 'Interactive global map featuring geographic intelligence resources, imagery, and investigative tools.',
    url: 'https://cybdetective.com/osintmap/',
    icon_name: 'globe',
  },
  {
    name: 'CybDetective OSINT Directory',
    category: 'GeoINT',
    description: 'Comprehensive directory of web-based investigative tools and specialized search engines.',
    url: 'https://share.google/jI6vMZgalq8g3HeJg',
    icon_name: 'search',
  },
  // GeoINT
  {
    name: 'Sentinel Hub EO Browser',
    category: 'GeoINT',
    description: 'Satellite imagery visualization platform offering Sentinel-2, Landsat, and MODIS environmental bands.',
    url: 'https://apps.sentinel-hub.com/eo-browser/',
    icon_name: 'satellite',
  },
  {
    name: 'Global Forest Watch Maps',
    category: 'GeoINT',
    description: 'Real-time deforestation, land clearing, and canopy loss monitoring system.',
    url: 'https://www.globalforestwatch.org/map/',
    icon_name: 'trees',
  },
  // Cadastral Maps
  {
    name: 'OpenStreetMap Cadastral Layers',
    category: 'Cadastral Maps',
    description: 'Open source land parcel, infrastructure, and administrative boundary overlays.',
    url: 'https://www.openstreetmap.org/',
    icon_name: 'map',
  },
  {
    name: 'Bhuvan ISRO Geo-Platform',
    category: 'Cadastral Maps',
    description: 'Indian Space Research Organisation Indian satellite portal for land use and cadastral mapping.',
    url: 'https://bhuvan.nrsc.gov.in/',
    icon_name: 'layers',
  },
  // Corporate Registries
  {
    name: 'OpenCorporates',
    category: 'Corporate Registries',
    description: 'The largest open database of companies and corporate entities in the world.',
    url: 'https://opencorporates.com/',
    icon_name: 'building',
  },
  {
    name: 'Ministry of Corporate Affairs (MCA)',
    category: 'Corporate Registries',
    description: 'Official registry for company filings, directors, and corporate compliance logs.',
    url: 'https://www.mca.gov.in/',
    icon_name: 'file-text',
  },
  // Environmental Databases
  {
    name: 'EPA Enforcement & Compliance (ECHO)',
    category: 'Environmental Databases',
    description: 'Environmental Protection Agency facility permit, pollution discharge, and violation history records.',
    url: 'https://echo.epa.gov/',
    icon_name: 'database',
  },
  {
    name: 'Global River Water Quality (GEMStat)',
    category: 'Environmental Databases',
    description: 'UNESCO/UNEP global surface water quality data and chemical parameters.',
    url: 'https://gemstat.org/',
    icon_name: 'droplets',
  },
];

async function seedOsintTools() {
  try {
    console.log('🛠️ Creating OSINT database tables...');

    // 1. Create osint_tools table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS osint_tools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        icon_name VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create osint_tracking_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS osint_tracking_logs (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER,
        target_type VARCHAR(50) NOT NULL,
        identifier VARCHAR(100) NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        coordinates GEOMETRY(Point, 4326),
        altitude_m NUMERIC,
        velocity_mps NUMERIC,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('🌱 Seeding OSINT Directory tools...');
    for (const tool of defaultTools) {
      await pool.query(
        `INSERT INTO osint_tools (name, category, description, url, icon_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING;`,
        [tool.name, tool.category, tool.description, tool.url, tool.icon_name]
      );
    }
    console.log('✅ OSINT Tables created & tools seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding OSINT tools:', error);
  } finally {
    await pool.end();
  }
}

seedOsintTools();