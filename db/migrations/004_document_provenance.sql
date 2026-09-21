CREATE TABLE IF NOT EXISTS document_import_provenance (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  source_path text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz NOT NULL,
  import_method text NOT NULL,
  UNIQUE(document_id, source_path, source_sha256)
);

CREATE INDEX IF NOT EXISTS document_import_provenance_document_idx
  ON document_import_provenance(document_id, imported_at);
