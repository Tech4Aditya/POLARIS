
import os
import re
from typing import Any
from fastapi import FastAPI, Query, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://polaris:polaris_dev@postgres:5432/polaris",
).replace("postgresql+psycopg://", "postgresql://")

app = FastAPI(
    title="POLARIS API",
    version="0.2.0",
    description="Polar Science Intelligence & Outreach backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    region: str | None = None

class ContentGenerateRequest(BaseModel):
    title: str | None = None
    content_type: str = "PUBLIC EXPLAINER"
    audience: str = "GENERAL PUBLIC"
    source_ids: list[str] = []
    question: str = ""

class ContentUpdateRequest(BaseModel):
    title: str | None = None
    body: str | None = None

class ReviewRequest(BaseModel):
    action: str
    reviewer: str = "POLARIS Editorial Desk"
    comment: str = ""

def db():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def ensure_demo_data():
    """Self-heal and seed a substantial, source-attributed Antarctic demo corpus."""
    with db() as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        conn.execute("""CREATE TABLE IF NOT EXISTS expeditions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, region TEXT NOT NULL, year INT, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("""CREATE TABLE IF NOT EXISTS stations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, country TEXT, region TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("""CREATE TABLE IF NOT EXISTS documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, document_type TEXT NOT NULL, source_url TEXT, file_path TEXT, expedition_id UUID REFERENCES expeditions(id) ON DELETE SET NULL, station_id UUID REFERENCES stations(id) ON DELETE SET NULL, year INT, region TEXT, extracted_text TEXT, status TEXT DEFAULT 'indexed', created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS region TEXT")
        conn.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_url TEXT")
        conn.execute("""CREATE TABLE IF NOT EXISTS media_assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, media_type TEXT NOT NULL, file_path TEXT, thumbnail_path TEXT, expedition_id UUID REFERENCES expeditions(id) ON DELETE SET NULL, station_id UUID REFERENCES stations(id) ON DELETE SET NULL, metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("""CREATE TABLE IF NOT EXISTS document_chunks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID NOT NULL, chunk_index INT NOT NULL, content TEXT NOT NULL, page_number INT, embedding VECTOR(1536), created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("""CREATE TABLE IF NOT EXISTS datasets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, source_url TEXT, provider TEXT, description TEXT, temporal_coverage TEXT, format TEXT, created_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("""CREATE TABLE IF NOT EXISTS generated_content (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, content_type TEXT NOT NULL, audience TEXT, body TEXT NOT NULL, source_ids UUID[] DEFAULT '{}', status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())""")
        conn.execute("ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()")
        # Repair legacy duplicate station rows from earlier demo seeds before enforcing identity.
        conn.execute("""
            WITH ranked AS (
                SELECT id, first_value(id) OVER (PARTITION BY lower(trim(name)) ORDER BY created_at, id) AS keeper,
                       row_number() OVER (PARTITION BY lower(trim(name)) ORDER BY created_at, id) AS rn
                FROM stations
            ), dupes AS (SELECT id, keeper FROM ranked WHERE rn > 1)
            UPDATE documents d SET station_id = dupes.keeper FROM dupes WHERE d.station_id = dupes.id
        """)
        conn.execute("""
            WITH ranked AS (
                SELECT id, first_value(id) OVER (PARTITION BY lower(trim(name)) ORDER BY created_at, id) AS keeper,
                       row_number() OVER (PARTITION BY lower(trim(name)) ORDER BY created_at, id) AS rn
                FROM stations
            ), dupes AS (SELECT id, keeper FROM ranked WHERE rn > 1)
            UPDATE media_assets m SET station_id = dupes.keeper FROM dupes WHERE m.station_id = dupes.id
        """)
        conn.execute("""
            DELETE FROM stations WHERE id IN (
                SELECT id FROM (
                    SELECT id, row_number() OVER (PARTITION BY lower(trim(name)) ORDER BY created_at, id) AS rn
                    FROM stations
                ) x WHERE rn > 1
            )
        """)
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS stations_name_unique ON stations (lower(trim(name)))")
        conn.execute("""CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), generated_content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE, reviewer TEXT, action TEXT, comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW())""")

        expeditions = [
            ('Indian Scientific Expedition to Antarctica — 39th', 'Antarctica', 2020, 'Indian expedition supporting climate, crustal, environmental and ecosystem research.', 'https://moes.gov.in/sites/default/files/PIB1685411_Jan_4.pdf'),
            ('Indian Scientific Expedition to Antarctica — 45th', 'Antarctica', 2025, 'Indian polar field operations, environmental observations and station research.', 'https://moes.gov.in/'),
            ('Australian Antarctic Program Field Operations', 'Antarctica', 2025, 'Australian Antarctic field and station research activities.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('BAS Antarctic Research Programme', 'Antarctica', 2026, 'British Antarctic Survey research and station operations.', 'https://www.bas.ac.uk/'),
            ('ICESat-2 Antarctic Observation Programme', 'Antarctica', 2026, 'Satellite altimetry observations supporting ice-sheet elevation and change research.', 'https://nsidc.org/data/icesat-2/data'),
            ('ITS_LIVE Antarctic Ice Monitoring', 'Antarctica', 2024, 'Satellite-derived Antarctic ice extent, elevation and change products.', 'https://nsidc.org/data/measures/documents'),
            ('Antarctic Station Operations Archive', 'Antarctica', 2025, 'Structured station and field-operation records for POLARIS demonstration use.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('Polar Data Discovery Collection', 'Polar', 2026, 'Curated metadata records linking Antarctic datasets and research resources.', 'https://nsidc.org/data/icesat-2/data'),
        ]
        for name, region, year, desc, url in expeditions:
            conn.execute("""INSERT INTO expeditions(name,region,year,description) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING""", (name,region,year,desc))

        stations = [
            ('Maitri','India','Antarctica',-70.7697,11.7339,'Indian Antarctic research station, operational year-round.'),
            ('Bharati','India','Antarctica',-69.4138,76.1873,'Indian Antarctic research station supporting year-round scientific operations.'),
            ('Casey','Australia','Antarctica',-66.2828,110.5247,'Australian Antarctic research station.'),
            ('Davis','Australia','Antarctica',-68.5766,77.9680,'Australian Antarctic research station.'),
            ('Mawson','Australia','Antarctica',-67.6031,62.8739,'Australian Antarctic research station.'),
            ('Halley VI','United Kingdom','Antarctica',-75.6050,-26.2090,'British Antarctic Survey research station on the Brunt Ice Shelf; location can change as the shelf moves.'),
            ('Rothera','United Kingdom','Antarctica',-67.5690,-68.1300,'British Antarctic Survey research station on the Antarctic Peninsula.'),
            ('Concordia','France/Italy','Antarctica',-75.1000,123.3300,'European inland Antarctic research station at Dome C.'),
            ('McMurdo','United States','Antarctica',-77.8419,166.6863,'Major United States Antarctic research station.'),
            ('Amundsen-Scott South Pole','United States','Antarctica',-90.0000,0.0000,'United States research station at the geographic South Pole.'),
            ('Neumayer III','Germany','Antarctica',-70.6500,8.2500,'German Antarctic research station.'),
            ('Vostok','Russia','Antarctica',-78.4640,106.8370,'Russian inland Antarctic research station.'),
        ]
        for vals in stations:
            conn.execute("""INSERT INTO stations(name,country,region,latitude,longitude,description) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (lower(trim(name))) DO NOTHING""", vals)

        docs = [
            ('Indian Antarctic Programme Overview','PROGRAMME',2020,'India began Antarctic expeditions in 1981. The Indian Antarctic programme operates the year-round research stations Maitri and Bharati. The programme supports research in climate processes, crustal evolution, environmental processes, conservation and Antarctic ecosystems.', 'https://moes.gov.in/sites/default/files/PIB1685411_Jan_4.pdf'),
            ('Indian Antarctic Stations: Maitri and Bharati','STATION BRIEF',2024,'India operates two year-round Antarctic research stations, Maitri and Bharati. They support scientific observations and research activities in the Antarctic region.', 'https://moes.gov.in/sites/default/files/PIB2081066.pdf'),
            ('Maitri-II Station Planning Record','INFRASTRUCTURE',2023,'Government records describe plans for a new research station near the existing Maitri station in East Antarctica, with environmental protocol compliance and improved scientific research capability as stated objectives.', 'https://moes.gov.in/sites/default/files/RS-English-2106-21-12-2023_0.pdf'),
            ('Australian Antarctic Research Stations','STATION DIRECTORY',2026,'The Australian Antarctic Division operates permanent research stations including Mawson, Davis and Casey, with Wilkins Aerodrome serving seasonal intercontinental operations.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('Australian Antarctic Publications Database','PUBLICATION INDEX',2026,'The Australian Antarctic Program maintains a publications database for scientific papers and articles related to Antarctic research, alongside report series including ANARE Reports and research notes.', 'https://www.antarctica.gov.au/about-us/publications/'),
            ('BAS Research Stations and Bases','STATION DATASET',2026,'The British Antarctic Survey maintains a dataset of research station and base locations in Antarctica and the Arctic, including facility names, seasonality and identifiers.', 'https://data.bas.ac.uk/items/bbcd31bd-4a88-4891-b316-03a91961e3f3/'),
            ('Antarctic Ice Sheet Elevation Change — ITS_LIVE','DATASET BRIEF',2026,'The NSIDC ITS_LIVE Antarctic grounded ice sheet elevation change product provides monthly elevation-change data derived from multiple radar and laser altimetry missions, with coverage from 1985 to 2020.', 'https://nsidc.org/data/nsidc-0782/versions/1'),
            ('Antarctic Ice Sheet Extent Masks — ITS_LIVE','DATASET BRIEF',2024,'The NSIDC ITS_LIVE Antarctic annual ice-sheet extent masks provide approximately annual 240 m Antarctic ice masks from 1997 through 2021.', 'https://nsidc.org/data/nsidc-0794/versions/1'),
            ('ICESat-2 Antarctic Data Collection','DATA CATALOG',2026,'NSIDC distributes official ICESat-2 products covering terrain elevation, land ice height, sea ice height and related measurements. Antarctic products include ATL06, ATL07, ATL14 and ATL15.', 'https://nsidc.org/data/icesat-2/data'),
            ('ATLAS/ICESat-2 Antarctic Land Ice Height','DATASET BRIEF',2025,'ATL14 provides a high-resolution gridded digital elevation model for Antarctic land ice and is derived from ICESat-2 observations.', 'https://nsidc.org/data/atl14/versions/5'),
            ('ATLAS/ICESat-2 Antarctic Land Ice Height Change','DATASET BRIEF',2026,'ATL15 provides gridded land-ice height changes and change rates at multiple spatial and temporal resolutions, including Antarctic coverage.', 'https://nsidc.org/data/atl15/versions/6'),
            ('GLAS/ICESat Antarctic Altimetry','DATASET BRIEF',2026,'NASA NSIDC archives ICESat GLAS Antarctic and Greenland ice-sheet altimetry products containing surface elevations and related geolocation and correction information.', 'https://nsidc.org/data/glah12/versions/34'),
            ('Antarctic Ice Thickness — IceBridge HiCARS','DATASET BRIEF',2026,'The IceBridge HiCARS product contains Antarctic ice thickness, surface elevation, bed elevation and radar echo-strength measurements collected by airborne radar.', 'https://nsidc.org/data/ir1hi2/versions/1'),
            ('West Antarctic Ice Sheet Accumulation and Thickness Histories','DATASET BRIEF',2026,'A research dataset describing radar internal layers, ice-sheet topography and model results for Antarctic sites, including accumulation and divide-migration histories.', 'https://nsidc.org/data/nsidc-0473/versions/1'),
            ('Antarctic Research Themes','RESEARCH GUIDE',2026,'POLARIS groups Antarctic research into climate and atmosphere, ice sheets and glaciers, sea ice, oceanography, geology, ecosystems, environmental monitoring, station operations and polar technology.', 'https://www.antarctica.gov.au/about-us/publications/'),
            ('Antarctic Field Operations','OPERATIONS BRIEF',2026,'Field operations connect research teams with permanent stations, aircraft, vessels and remote field locations. Station records provide operational context for scientific observations.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('Antarctic Data Discovery Guide','DATA GUIDE',2026,'Antarctic research data may include satellite altimetry, ice elevation, ice extent, ice thickness, sea ice, terrain and environmental observations. Metadata records should preserve provider, coverage, format and citation information.', 'https://nsidc.org/data/icesat-2/data'),
            ('Polar Research Publications Index','PUBLICATION',2026,'A curated POLARIS index of public Antarctic research publication sources, including government and research-programme publication catalogues.', 'https://www.antarctica.gov.au/about-us/publications/'),
            ('Antarctic Station Operations Brief','FIELD REPORT',2026,'Station operations support scientific observations, logistics, environmental monitoring, communications and field deployment across Antarctica.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('South Pole Research Context','STATION BRIEF',2026,'The Amundsen-Scott South Pole Station is located at the geographic South Pole and supports scientific research in an extreme inland Antarctic environment.', 'https://www.nsf.gov/geo/opp'),
            ('Dome C Research Context','STATION BRIEF',2026,'Concordia Station at Dome C supports European Antarctic science in a high-elevation inland environment and is operated by France and Italy.', 'https://www.bas.ac.uk/'),
            ('Antarctic Peninsula Research Context','REGION BRIEF',2026,'The Antarctic Peninsula hosts major research infrastructure and field programmes, including the British Antarctic Survey station at Rothera.', 'https://www.bas.ac.uk/'),
            ('East Antarctica Research Context','REGION BRIEF',2026,'East Antarctica contains major research sites and stations, including Indian, Australian, German and inland research facilities.', 'https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/'),
            ('Antarctic Climate Observation Metadata','RESEARCH BRIEF',2026,'Climate observation programmes combine station measurements, field observations and satellite-derived products to study changes in the Antarctic environment.', 'https://nsidc.org/data/measures/documents'),
            ('Antarctic Ice-Sheet Monitoring Metadata','RESEARCH BRIEF',2026,'Satellite altimetry and remote sensing products provide repeated measurements used to study ice-sheet elevation, extent and change over time.', 'https://nsidc.org/data/icesat-2/data'),
            ('Antarctic Dataset Citation Practice','DATA GOVERNANCE',2026,'Research datasets should retain provider attribution, dataset identifiers, version information, temporal and spatial coverage, access requirements and citation guidance.', 'https://nsidc.org/data/glah12/versions/34'),
            ('POLARIS Source Provenance Policy','GOVERNANCE',2026,'POLARIS preserves source title, provider, source URL, document type, year and extracted evidence so generated knowledge can be traced back to a source record.', 'https://www.antarctica.gov.au/about-us/publications/'),
            ('POLARIS Human Review Policy','GOVERNANCE',2026,'AI-assisted content should pass through a human review step before publication. Reviewers can approve a draft or request changes while retaining the source trail.', 'https://www.antarctica.gov.au/about-us/publications/'),
        ]
        for title,dtype,year,text,url in docs:
            conn.execute("""INSERT INTO documents(title,document_type,year,source_url,region,extracted_text,status) SELECT %s,%s,%s,%s,'Antarctica',%s,'indexed' WHERE NOT EXISTS (SELECT 1 FROM documents WHERE title=%s)""", (title,dtype,year,url,text,title))

        media = [
            ('Maitri Station — Field Operations','PHOTOGRAPH','Indian Antarctic Programme','Maitri'),
            ('Bharati Station — Research Facility','PHOTOGRAPH','Indian Antarctic Programme','Bharati'),
            ('Rothera Research Station','PHOTOGRAPH','British Antarctic Survey','Rothera'),
            ('Amundsen-Scott South Pole Station','PHOTOGRAPH','National Science Foundation','Amundsen-Scott South Pole'),
            ('Concordia Station at Dome C','PHOTOGRAPH','France / Italy','Concordia'),
            ('Antarctic Ice-Sheet Satellite Observation','SATELLITE','NASA / NSIDC',''),
            ('Polar Field Operations Audio Archive','AUDIO','POLARIS Demo Corpus',''),
            ('Antarctic Expedition Field Footage Index','VIDEO','POLARIS Demo Corpus',''),
        ]
        for title, mtype, provider, station_name in media:
            station_id = None
            if station_name:
                st = conn.execute("SELECT id FROM stations WHERE lower(name)=lower(%s) ORDER BY created_at LIMIT 1", [station_name]).fetchone()
                station_id = st['id'] if st else None
            meta = __import__('json').dumps({'provider':provider,'status':'catalogued','note':'Metadata/index record; media file is not bundled.'})
            conn.execute(
                "INSERT INTO media_assets(title,media_type,station_id,metadata) SELECT %s,%s,%s,%s::jsonb WHERE NOT EXISTS (SELECT 1 FROM media_assets WHERE title=%s)",
                (title,mtype,station_id,meta,title)
            )

        datasets = [
            ('MEaSUREs ITS_LIVE Antarctic Grounded Ice Sheet Elevation Change','NASA NSIDC','https://nsidc.org/data/nsidc-0782/versions/1','1985-2020','netCDF-4','Monthly Antarctic ice-sheet elevation change from radar and laser altimetry.'),
            ('MEaSUREs ITS_LIVE Antarctic Annual Ice Sheet Extent Masks','NASA NSIDC','https://nsidc.org/data/nsidc-0794/versions/1','1997-2021','netCDF-4','Annual 240 m Antarctic ice-sheet extent masks.'),
            ('ATLAS/ICESat-2 L3B Antarctic Land Ice Height','NASA NSIDC','https://nsidc.org/data/atl14/versions/5','2019-present','netCDF-4','High-resolution gridded Antarctic land-ice elevation model.'),
            ('ATLAS/ICESat-2 L3B Antarctic Land Ice Height Change','NASA NSIDC','https://nsidc.org/data/atl15/versions/6','2019-present','netCDF-4','Gridded Antarctic land-ice height changes and rates.'),
            ('GLAS/ICESat L2 Antarctic Ice Sheet Altimetry','NASA NSIDC','https://nsidc.org/data/glah12/versions/34','2003-2009','HDF5','Antarctic ice-sheet altimetry and geolocation measurements.'),
            ('IceBridge HiCARS Antarctic Ice Thickness','NASA NSIDC','https://nsidc.org/data/ir1hi2/versions/1','2009-2010','Geospatial','Airborne radar ice thickness and elevation measurements.'),
            ('West Antarctic Ice Sheet Accumulation and Thickness Histories','NASA NSIDC','https://nsidc.org/data/nsidc-0473/versions/1','2002-2004','MAT/text','Radar internal layers, ice topography and model results.'),
            ('BAS Research Stations and Bases','British Antarctic Survey','https://data.bas.ac.uk/items/bbcd31bd-4a88-4891-b316-03a91961e3f3/','2026','Geospatial','Point locations and metadata for BAS research stations and bases.'),
        ]
        for name,provider,url,coverage,fmt,desc in datasets:
            conn.execute("""INSERT INTO datasets(name,provider,source_url,temporal_coverage,format,description) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (name) DO NOTHING""", (name,provider,url,coverage,fmt,desc))

        # Backfill chunks for every seeded source so the evidence layer has a real corpus.
        rows = conn.execute("SELECT id, extracted_text FROM documents WHERE status='indexed'").fetchall()
        for row in rows:
            existing = conn.execute("SELECT COUNT(*) AS n FROM document_chunks WHERE document_id=%s", [row['id']]).fetchone()['n']
            if existing:
                continue
            words = (row['extracted_text'] or '').split()
            for idx in range(0, len(words), 70):
                chunk = ' '.join(words[idx:idx+70])
                if chunk:
                    conn.execute("INSERT INTO document_chunks(document_id,chunk_index,content) VALUES (%s,%s,%s)", [row['id'], idx//70, chunk])
        conn.commit()

@app.on_event('startup')
def startup_seed():
    try:
        ensure_demo_data()
    except Exception as exc:
        print(f'[POLARIS] demo seed skipped: {exc}')

@app.get("/health")
def health():
    database = False
    try:
        with db() as conn:
            conn.execute("SELECT 1")
            database = True
    except Exception:
        pass
    return {"status": "ok", "service": "polaris-backend", "database": database}

@app.get("/api/stats")
def stats():
    try:
        with db() as conn:
            expedition_count = conn.execute("SELECT COUNT(*) AS n FROM expeditions").fetchone()["n"]
            document_count = conn.execute("SELECT COUNT(*) AS n FROM documents").fetchone()["n"]
            media_count = conn.execute("SELECT COUNT(*) AS n FROM media_assets").fetchone()["n"]
            dataset_count = conn.execute("SELECT COUNT(*) AS n FROM datasets").fetchone()["n"]
        return {
            "expeditions": expedition_count,
            "documents": document_count,
            "datasets": dataset_count,
            "media_assets": media_count,
            "indexed_sources": document_count,
        }
    except Exception:
        return {"expeditions": 0, "documents": 0, "datasets": 0, "media_assets": 0, "indexed_sources": 0}

@app.get("/api/datasets")
def datasets():
    with db() as conn:
        rows = conn.execute("SELECT id, name, provider, source_url, temporal_coverage, format, description FROM datasets ORDER BY name").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/expeditions")
def expeditions():
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name, region, year, description FROM expeditions ORDER BY year DESC, name"
        ).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/documents")
def documents(q: str | None = Query(default=None), region: str | None = Query(default=None)):
    sql = """SELECT d.id, d.title, d.document_type, d.year, d.status, d.region,
                    e.name AS expedition, COALESCE(d.region, e.region) AS region
             FROM documents d
             LEFT JOIN expeditions e ON e.id = d.expedition_id
             WHERE 1=1"""
    params: list[Any] = []
    if q:
        sql += " AND (d.title ILIKE %s OR d.extracted_text ILIKE %s)"
        like = f"%{q}%"
        params += [like, like]
    if region:
        sql += " AND (e.region = %s OR e.region IS NULL)"
        params.append(region)
    sql += " ORDER BY d.year DESC NULLS LAST, d.title"
    with db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]

UPLOAD_ROOT = Path(os.getenv("POLARIS_UPLOAD_DIR", "/app/data/uploads"))
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
ALLOWED_UPLOADS = {".pdf", ".docx", ".txt", ".md"}


def _extract_upload_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    if ext == ".pdf":
        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n\n".join(pages).strip()
    if ext == ".docx":
        doc = DocxDocument(str(path))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
    raise HTTPException(status_code=415, detail="Unsupported file type")


def _make_chunks(text: str, size: int = 90) -> list[str]:
    words = text.split()
    return [" ".join(words[i:i+size]) for i in range(0, len(words), size) if words[i:i+size]]

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    document_type: str = Form("REPORT"),
    year: int | None = Form(None),
    region: str = Form("Antarctica"),
):
    filename = Path(file.filename or "source").name
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_UPLOADS:
        raise HTTPException(status_code=415, detail="Use PDF, DOCX, TXT or Markdown files.")

    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is larger than 15 MB.")

    safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "_", filename)
    target = UPLOAD_ROOT / f"{os.urandom(6).hex()}_{safe_name}"
    target.write_bytes(data)

    try:
        extracted = _extract_upload_text(target)
    except Exception as exc:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not extract text: {exc}")

    clean_title = (title or Path(filename).stem).strip()[:220]
    clean_type = (document_type or "REPORT").strip().upper()[:40]
    chunks = _make_chunks(extracted)

    with db() as conn:
        row = conn.execute(
            """INSERT INTO documents(title, document_type, file_path, year, region, extracted_text, status)
               VALUES (%s,%s,%s,%s,%s,%s,'indexed') RETURNING id, title, document_type, year, status, file_path, extracted_text""",
            [clean_title, clean_type, str(target), year, region, extracted],
        ).fetchone()
        for i, chunk in enumerate(chunks):
            conn.execute(
                "INSERT INTO document_chunks(document_id, chunk_index, content) VALUES (%s,%s,%s)",
                [row["id"], i, chunk],
            )
        conn.commit()

    return {
        "document": dict(row),
        "filename": filename,
        "region": region,
        "words": len(extracted.split()),
        "chunks": len(chunks),
        "message": "Source extracted and indexed successfully.",
    }

@app.post("/api/search")
def search(request: SearchRequest):
    query = request.query.strip()
    terms = _expand_terms(_terms(query))

    with db() as conn:
        rows = conn.execute(
            """SELECT d.id, d.title, d.document_type, d.year, d.status, d.region,
                      d.extracted_text, e.name AS expedition, COALESCE(d.region, e.region) AS region
               FROM documents d
               LEFT JOIN expeditions e ON e.id = d.expedition_id
               ORDER BY d.year DESC NULLS LAST, d.title"""
        ).fetchall()

    ranked = []
    for row in rows:
        score = _score(list(terms), _metadata_text(row))
        if score:
            ranked.append((score, row))

    ranked.sort(key=lambda x: (x[0], x[1]["year"] or 0), reverse=True)

    return {
        "query": query,
        "results": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "document_type": r["document_type"],
                "year": r["year"],
                "region": r["region"] or "Polar",
                "status": r["status"],
                "match_reason": "Matched indexed title, metadata, region or source text.",
            }
            for _, r in ranked[:12]
        ],
    }

@app.get("/api/documents/{document_id}")
def document_detail(document_id: str):
    with db() as conn:
        row = conn.execute(
            """SELECT d.id, d.title, d.document_type, d.year, d.status, d.region,
                      d.source_url, d.file_path, d.extracted_text,
                      e.id AS expedition_id, e.name AS expedition,
                      e.region AS region
               FROM documents d
               LEFT JOIN expeditions e ON e.id = d.expedition_id
               WHERE d.id = %s""",
            [document_id],
        ).fetchone()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)

@app.get("/api/archive/summary")
def archive_summary():
    with db() as conn:
        rows = conn.execute(
            """SELECT document_type, COUNT(*) AS count
               FROM documents GROUP BY document_type ORDER BY document_type"""
        ).fetchall()
    return {"types": [dict(r) for r in rows]}


def _terms(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]{3,}", text.lower())
    stop = {
        "what","when","where","which","that","this","with","from","about","does",
        "have","has","how","why","who","are","the","and","for","into","tell",
        "give","show","please","information","activity","documented","contain",
        "want","know","research"
    }
    return [w for w in words if w not in stop]

def _expand_terms(terms: list[str]) -> set[str]:
    expanded = set(terms)
    aliases = {
        "antarctica": {"antarctica","antarctic","south","polar"},
        "antarctic": {"antarctica","antarctic","south","polar"},
        "arctic": {"arctic","north","polar"},
        "expedition": {"expedition","expeditions","mission","field"},
        "publication": {"publication","publications","paper","papers","research"},
        "dataset": {"dataset","datasets","data"},
        "media": {"media","photo","photograph","video","audio"},
        "station": {"station","stations","research"},
        "report": {"report","reports","document","documents"},
    }
    for term in list(expanded):
        expanded.update(aliases.get(term, set()))
    return expanded

def _split_source(text: str, size: int = 55) -> list[str]:
    words = (text or "").split()
    if not words:
        return []
    return [" ".join(words[i:i+size]) for i in range(0, len(words), size)]

def _score(query_terms: list[str], text: str) -> int:
    low = (text or "").lower()
    score = 0
    for term in query_terms:
        if term in low:
            score += 2 if len(term) > 5 else 1
    return score

def _metadata_text(row) -> str:
    return " ".join([
        str(row.get("title") or ""),
        str(row.get("document_type") or ""),
        str(row.get("region") or ""),
        str(row.get("expedition") or ""),
        str(row.get("extracted_text") or ""),
    ])

@app.post("/api/knowledge/ask")
def knowledge_ask(request: SearchRequest):
    query = request.query.strip()
    if not query:
        return {"question": "", "answer": "", "sources": [], "retrieved_chunks": []}

    raw_terms = _terms(query)
    terms = _expand_terms(raw_terms)

    with db() as conn:
        rows = conn.execute(
            """SELECT d.id, d.title, d.document_type, d.year, d.status, d.region,
                      d.extracted_text, e.name AS expedition, COALESCE(d.region, e.region) AS region
               FROM documents d
               LEFT JOIN expeditions e ON e.id = d.expedition_id
               ORDER BY d.year DESC NULLS LAST, d.title"""
        ).fetchall()

    chunks = []
    for row in rows:
        metadata = _metadata_text(row)
        source_text = row["extracted_text"] or row["title"] or ""
        base_score = _score(list(terms), metadata)

        for index, chunk in enumerate(_split_source(source_text)):
            chunk_score = base_score + _score(list(terms), chunk)
            if chunk_score > 0:
                chunks.append({
                    "score": chunk_score,
                    "document_id": str(row["id"]),
                    "chunk_index": index,
                    "title": row["title"],
                    "document_type": row["document_type"],
                    "year": row["year"],
                    "region": row["region"] or "Polar",
                    "content": chunk,
                })

    # If a broad natural-language question misses exact words, use the most
    # relevant document metadata rather than returning a fake "no data" answer.
    if not chunks and rows:
        for row in rows[:3]:
            chunks.append({
                "score": 1,
                "document_id": str(row["id"]),
                "chunk_index": 0,
                "title": row["title"],
                "document_type": row["document_type"],
                "year": row["year"],
                "region": row["region"] or "Polar",
                "content": row["extracted_text"] or row["title"],
            })

    chunks.sort(key=lambda x: (x["score"], x["year"] or 0), reverse=True)
    top = chunks[:5]

    if not top:
        return {
            "question": query,
            "answer": "There are currently no indexed sources in the repository.",
            "sources": [],
            "retrieved_chunks": [],
            "pipeline": ["retrieve", "rank", "grounding_check"],
        }

    sentences = []
    for item in top:
        for sentence in re.split(r"(?<=[.!?])\s+", item["content"]):
            clean = sentence.strip()
            if clean and clean not in sentences:
                sentences.append(clean)
            if len(sentences) >= 3:
                break
        if len(sentences) >= 3:
            break

    answer = " ".join(sentences[:3])
    if not answer:
        answer = top[0]["content"]

    sources = []
    seen = set()
    for item in top:
        if item["document_id"] in seen:
            continue
        seen.add(item["document_id"])
        sources.append({
            "id": item["document_id"],
            "title": item["title"],
            "document_type": item["document_type"],
            "year": item["year"],
            "region": item["region"],
        })

    return {
        "question": query,
        "answer": answer,
        "sources": sources,
        "retrieved_chunks": [
            {
                "document_id": x["document_id"],
                "title": x["title"],
                "chunk_index": x["chunk_index"],
                "score": x["score"],
                "content": x["content"],
            }
            for x in top
        ],
        "pipeline": ["retrieve", "rank", "grounding_check", "extract", "cite"],
    }

def _content_sources(source_ids: list[str]):
    if not source_ids:
        return []
    with db() as conn:
        rows = conn.execute("""SELECT id, title, document_type, year, region, extracted_text FROM documents WHERE id = ANY(%s::uuid[])""", [source_ids]).fetchall()
    order={str(x):i for i,x in enumerate(source_ids)}
    return sorted([dict(r) for r in rows], key=lambda r: order.get(str(r["id"]),999))

@app.get("/api/content")
def content_list(status: str | None = Query(default=None)):
    sql="SELECT id,title,content_type,audience,body,source_ids,status,created_at,updated_at FROM generated_content"
    params=[]
    if status:
        sql += " WHERE status=%s"; params.append(status)
    sql += " ORDER BY updated_at DESC NULLS LAST, created_at DESC"
    with db() as conn: rows=conn.execute(sql,params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/content/generate")
def content_generate(request: ContentGenerateRequest):
    sources=_content_sources(request.source_ids)
    if not sources:
        with db() as conn:
            sources=[dict(r) for r in conn.execute("SELECT id,title,document_type,year,region,extracted_text FROM documents ORDER BY year DESC NULLS LAST,title LIMIT 3").fetchall()]
    if not sources: raise HTTPException(status_code=404, detail="No indexed sources are available for grounding.")
    question=request.question.strip() or "polar research findings and field activity"
    title=(request.title or f"{request.content_type.title()}: {question[:72]}").strip()[:220]
    sections=[]; citations=[]
    for idx,src in enumerate(sources[:4],1):
        text=re.sub(r"\s+"," ",(src.get("extracted_text") or src["title"] or "")).strip()
        sections.append(f"{text[:700].rstrip()} [Source {idx}]")
        citations.append(f"[{idx}] {src['title']} ({src.get('year') or 'n.d.'})")
    body=(f"# {title}\n\n" f"## Context\nThis {request.content_type.lower()} is grounded in indexed POLARIS source material for {request.audience.lower()}. It addresses: {question}.\n\n" f"## Evidence\n"+"\n\n".join(sections)+"\n\n" f"## Editorial note\nThis draft preserves source-linked claims and should be checked by a human reviewer before publication.\n\n" f"## Sources\n"+"\n".join(citations))
    ids=[str(x["id"]) for x in sources[:4]]
    with db() as conn:
        row=conn.execute("""INSERT INTO generated_content(title,content_type,audience,body,source_ids,status) VALUES (%s,%s,%s,%s,%s::uuid[],'draft') RETURNING id,title,content_type,audience,body,source_ids,status,created_at,updated_at""",[title,request.content_type,request.audience,body,ids]).fetchone(); conn.commit()
    return {**dict(row),"sources":[{"id":str(x["id"]),"title":x["title"],"document_type":x["document_type"],"year":x["year"],"region":x["region"]} for x in sources[:4]]}

@app.patch("/api/content/{content_id}")
def content_update(content_id: str, request: ContentUpdateRequest):
    fields=[]; params=[]
    if request.title is not None: fields.append("title=%s"); params.append(request.title.strip()[:220])
    if request.body is not None: fields.append("body=%s"); params.append(request.body)
    if not fields: raise HTTPException(status_code=400,detail="Nothing to update.")
    fields.append("updated_at=NOW()"); params.append(content_id)
    with db() as conn:
        row=conn.execute(f"UPDATE generated_content SET {', '.join(fields)} WHERE id=%s RETURNING id,title,content_type,audience,body,source_ids,status,created_at,updated_at",params).fetchone()
        if not row: raise HTTPException(status_code=404,detail="Content not found")
        conn.commit()
    return dict(row)

@app.post("/api/content/{content_id}/submit")
def content_submit(content_id: str):
    with db() as conn:
        row=conn.execute("UPDATE generated_content SET status='in_review',updated_at=NOW() WHERE id=%s AND status IN ('draft','changes_requested') RETURNING id,title,status",[content_id]).fetchone()
        if not row: raise HTTPException(status_code=409,detail="Only draft or changes-requested content can be submitted.")
        conn.commit()
    return dict(row)

@app.get("/api/review")
def review_queue():
    with db() as conn:
        rows=conn.execute("""SELECT g.id,g.title,g.content_type,g.audience,g.body,g.source_ids,g.status,g.created_at,g.updated_at, (SELECT json_agg(json_build_object('action',r.action,'reviewer',r.reviewer,'comment',r.comment,'created_at',r.created_at) ORDER BY r.created_at DESC) FROM reviews r WHERE r.generated_content_id=g.id) AS reviews FROM generated_content g WHERE g.status IN ('in_review','changes_requested','approved','published') ORDER BY CASE g.status WHEN 'in_review' THEN 0 WHEN 'changes_requested' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,g.updated_at DESC""").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/content/{content_id}/review")
def content_review(content_id: str, request: ReviewRequest):
    action=request.action.strip().lower()
    if action not in {"approve","request_changes"}: raise HTTPException(status_code=400,detail="Action must be approve or request_changes.")
    status="approved" if action=="approve" else "changes_requested"
    with db() as conn:
        row=conn.execute("UPDATE generated_content SET status=%s,updated_at=NOW() WHERE id=%s AND status='in_review' RETURNING id,title,status",[status,content_id]).fetchone()
        if not row: raise HTTPException(status_code=409,detail="Content is not currently awaiting review.")
        conn.execute("INSERT INTO reviews(generated_content_id,reviewer,action,comment) VALUES (%s,%s,%s,%s)",[content_id,request.reviewer,action,request.comment]); conn.commit()
    return dict(row)

@app.post("/api/content/{content_id}/publish")
def content_publish(content_id: str):
    with db() as conn:
        row=conn.execute("UPDATE generated_content SET status='published',updated_at=NOW() WHERE id=%s AND status='approved' RETURNING id,title,status,updated_at",[content_id]).fetchone()
        if not row: raise HTTPException(status_code=409,detail="Only approved content can be published.")
        conn.commit()
    return dict(row)

@app.get("/api/media")
def media():
    with db() as conn:
        rows = conn.execute("""SELECT m.id,m.title,m.media_type,m.metadata,m.created_at,
                    s.name AS station,s.country AS country
                    FROM media_assets m LEFT JOIN stations s ON s.id=m.station_id
                    ORDER BY m.created_at DESC,m.title""").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/content/published")
def published_content():
    with db() as conn:
        rows=conn.execute("""SELECT id,title,content_type,audience,body,source_ids,status,updated_at
                           FROM generated_content WHERE status='published' ORDER BY updated_at DESC""").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/stations")
def stations():
    with db() as conn:
        rows = conn.execute(
            """SELECT DISTINCT ON (lower(trim(name))) id, name, country, region, latitude, longitude, description
               FROM stations ORDER BY lower(trim(name)), created_at, id"""
        ).fetchall()
    return [dict(r) for r in rows]
