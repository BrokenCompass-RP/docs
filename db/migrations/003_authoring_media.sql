ALTER TABLE documents ADD COLUMN IF NOT EXISTS browse_path text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS route_path text NULL;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS browse_path text[] NULL;

UPDATE documents SET route_path = CASE WHEN slug = 'building-manager' THEN '/guides/building-manager' ELSE '/docs/' || slug END
WHERE route_path IS NULL;

ALTER TABLE documents ALTER COLUMN route_path SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_route_path_unique ON documents(route_path);

CREATE TABLE IF NOT EXISTS document_assets (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image/png','image/jpeg','image/gif','image/webp')),
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 5242880),
  width integer NULL CHECK (width IS NULL OR width > 0),
  height integer NULL CHECK (height IS NULL OR height > 0),
  visibility text NOT NULL CHECK (visibility IN ('public','moderator','developer','administrator')),
  content bytea NOT NULL,
  created_by text NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS document_assets_document_idx ON document_assets(document_id);

UPDATE documents SET browse_path = CASE slug
  WHEN 'building-manager' THEN ARRAY['systems-features']
  WHEN 'getting-around' THEN ARRAY['getting-started']
  WHEN 'mechanic-job' THEN ARRAY['getting-started','jobs']
  WHEN 'community-rules' THEN ARRAY['community']
  WHEN 'architecture-guide' THEN ARRAY['development']
  ELSE browse_path END
WHERE cardinality(browse_path) = 0;
