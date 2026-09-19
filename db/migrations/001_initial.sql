CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  default_visibility text NOT NULL CHECK (default_visibility IN ('public','moderator','developer','administrator')),
  historical_first_published_at timestamptz NULL,
  imported_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  current_published_version_id uuid NULL
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK (version_number > 0),
  canonical_markdown text NOT NULL,
  content_hash text NOT NULL,
  published_at timestamptz NOT NULL,
  published_by text NULL,
  publication_kind text NOT NULL CHECK (publication_kind IN ('initial_import','publish','recovery')),
  recovered_from_version_id uuid NULL REFERENCES document_versions(id) ON DELETE RESTRICT,
  UNIQUE(document_id, version_number)
);

DO $$ BEGIN
  ALTER TABLE documents ADD CONSTRAINT documents_current_version_fk
    FOREIGN KEY (current_published_version_id) REFERENCES document_versions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS document_drafts (
  document_id uuid PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  canonical_markdown text NOT NULL,
  author_identity text NULL,
  base_published_version_id uuid NULL REFERENCES document_versions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS review_flags (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id text NULL,
  section_heading text NULL,
  reason text NOT NULL CHECK (reason IN ('outdated','incorrect','unclear','missing-information','something-else')),
  initial_comment text NOT NULL,
  reporter_identity text NULL,
  created_at timestamptz NOT NULL,
  version_at_report_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS review_comments (
  id uuid PRIMARY KEY,
  flag_id uuid NOT NULL REFERENCES review_flags(id) ON DELETE CASCADE,
  author_identity text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS review_resolutions (
  flag_id uuid PRIMARY KEY REFERENCES review_flags(id) ON DELETE CASCADE,
  resolved_by text NOT NULL,
  resolved_at timestamptz NOT NULL,
  version_at_resolution_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION reject_document_version_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'published document versions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immutable_document_versions ON document_versions;
CREATE TRIGGER immutable_document_versions
BEFORE UPDATE OR DELETE ON document_versions
FOR EACH ROW EXECUTE FUNCTION reject_document_version_mutation();

CREATE INDEX IF NOT EXISTS review_flags_document_created_idx ON review_flags(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS review_comments_flag_created_idx ON review_comments(flag_id, created_at);
