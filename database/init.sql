
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS expeditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    year INT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT,
    region TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    source_url TEXT,
    file_path TEXT,
    expedition_id UUID REFERENCES expeditions(id) ON DELETE SET NULL,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    year INT,
    region TEXT,
    extracted_text TEXT,
    status TEXT DEFAULT 'indexed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    page_number INT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    media_type TEXT NOT NULL,
    file_path TEXT,
    thumbnail_path TEXT,
    expedition_id UUID REFERENCES expeditions(id) ON DELETE SET NULL,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content_type TEXT NOT NULL,
    audience TEXT,
    body TEXT NOT NULL,
    source_ids UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE,
    reviewer TEXT,
    action TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO expeditions (name, region, year, description)
SELECT '45th Indian Scientific Expedition to Antarctica', 'Antarctica', 2025,
       'Seed expedition record for the POLARIS demonstration.'
WHERE NOT EXISTS (SELECT 1 FROM expeditions);

INSERT INTO expeditions (name, region, year, description)
SELECT 'Arctic Research Mission', 'Arctic', 2024,
       'Seed Arctic expedition record for the POLARIS demonstration.'
WHERE NOT EXISTS (SELECT 1 FROM expeditions WHERE name = 'Arctic Research Mission');

INSERT INTO stations (name, country, region, latitude, longitude, description)
SELECT 'Maitri', 'India', 'Antarctica', -70.7697, 11.7339,
       'Indian Antarctic research station.'
WHERE NOT EXISTS (SELECT 1 FROM stations);

INSERT INTO stations (name, country, region, latitude, longitude, description)
SELECT 'Bharati', 'India', 'Antarctica', -69.4138, 76.1873,
       'Indian Antarctic research station.'
WHERE NOT EXISTS (SELECT 1 FROM stations WHERE name = 'Bharati');

INSERT INTO documents (title, document_type, year, extracted_text, status)
SELECT '45th Antarctic Expedition Report', 'REPORT', 2025,
       'Environmental observations, field operations, meteorological measurements and station activities from the 45th Indian Scientific Expedition to Antarctica.',
       'indexed'
WHERE NOT EXISTS (SELECT 1 FROM documents);

INSERT INTO documents (title, document_type, year, extracted_text, status)
SELECT 'Polar Research Publications Index', 'PUBLICATION', 2024,
       'A demonstration index of polar science publications and research themes.',
       'indexed'
WHERE NOT EXISTS (SELECT 1 FROM documents WHERE title = 'Polar Research Publications Index');
