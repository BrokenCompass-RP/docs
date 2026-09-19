# Durable persistence architecture

Checkpoint 4 replaces prototype filesystem state without changing the content or authorization model.

## Persistence inventory

| State | Classification | Durable representation |
| --- | --- | --- |
| `content/*.md` seed documents | A — canonical authored content | Validated initialization input; canonical Markdown snapshots are stored in versions |
| Frontmatter title, description, default visibility | A — canonical authored content | `documents` metadata plus each immutable Markdown snapshot |
| Ordered H2 sections and access directives | A — canonical authored content | Canonical Markdown; no proprietary section format |
| Active draft Markdown, author, base version, timestamps | B — mutable application state | One `document_drafts` row per document |
| Published Markdown, hash, actor, time, kind, recovery provenance | C — immutable historical record | Append-only `document_versions` rows |
| Current published version | B — mutable application state | `documents.current_published_version_id` |
| Flag report and version-at-report | C — immutable historical record | `review_flags` |
| Review comments | C — immutable historical record | Append-only `review_comments` |
| Resolution and version-at-resolution | C — immutable historical record | One `review_resolutions` row per flag |
| Rendered HTML and search retrieval units | D — derived/rebuildable | Rebuilt from the current immutable Markdown; not persisted |
| Visibility and capability grants | E — authorization/configuration | Source-controlled named policy modules, not SQL |
| Development identity cookie and View As selection | F — development-only/ephemeral | Never persisted in PostgreSQL |

## Relationships

```text
documents 1 ── 0..1 document_drafts
documents 1 ── * document_versions
documents 1 ── 0..1 current document_version
documents 1 ── * review_flags
review_flags 1 ── * review_comments
review_flags 1 ── 0..1 review_resolutions
review_flags ── version_at_report
review_resolutions ── version_at_resolution
document_versions ── optional recovered_from_version
```

`documents.id` is a stable UUID independent of the route slug. The bounded five-document registry supplies deterministic IDs during idempotent initialization.

## Publication transaction

PostgreSQL publication runs in one transaction:

1. Lock the document and active draft.
2. Validate draft Markdown with the authoritative parser.
3. Insert the next immutable version and content hash.
4. Update the document's current-version pointer.
5. Delete the active draft.
6. Commit.

Any failure rolls back all five database changes. Readers and search load only the current-version pointer, so they cannot observe an incomplete publication. Recovery similarly locks the document and appends a new version; historical rows are protected from update/delete by a database trigger.

## Date provenance

Existing corpus files do not contain trustworthy historical publication dates. Initialization therefore records `imported_at` and an `initial_import` publication event while leaving `historical_first_published_at` null. The UI shows **First published: Unknown**, not the import time. **Last updated** is the current version's publication timestamp.

## Repository selection

- `PERSISTENCE_BACKEND=postgres` selects PostgreSQL repositories.
- `DATABASE_URL` supplies the connection string.
- Development and tests may explicitly use the filesystem implementations as fast test doubles.
- Production rejects filesystem persistence and rejects missing database configuration. There is no production fallback.

Run `npm run db:migrate`, then `npm run db:initialize`. Initialization validates and imports only the bounded five-document corpus and is idempotent.

The local PostgreSQL data directory `bcrp_knowledge_dev/` is ignored. This keeps database-owned files out of source control. Production builds use Next.js's Webpack builder because Turbopack's dynamic filesystem tracing attempts to traverse PostgreSQL-owned storage when the data directory is located inside the repository and fails on its intentionally restricted permissions.

## Search consistency

Search remains the proven in-memory lexical adapter. It reads the same current immutable version as the reader and derives authorized retrieval units before ranking. No draft or review table is queried. Persisting retrieval units or introducing PostgreSQL full-text search is deferred until scale demonstrates a need; if added, the unit set must be rebuilt transactionally before advancing the current pointer.

## Deferred work

- General corpus migration and trustworthy historical publication dates
- Concurrent-edit conflict UI or realtime collaboration
- PostgreSQL full-text search
- Production abuse controls such as distributed rate limiting

## Discord identity sessions

`actors` supplies stable internal actor UUIDs. `actor_external_identities` maps an immutable Discord user ID to that actor without treating mutable usernames or display names as identity. `authorization_sessions` stores a hash of the browser token, the resolved named authorization identity, guild membership, the role-ID snapshot, and a 24-hour expiry.

Discord is consulted when a session is established. Expired sessions fail closed to Public and require a new Discord login, which rechecks guild membership and current role IDs. Leaving the guild or losing a mapped role therefore removes privilege no later than session expiry; adding a role takes effect on the next login. Discord failure during login creates no session. Discord/database failure while resolving an existing session produces Public behavior, while public reader/search remain available.

Discord provides claims only. Named visibility and capability policy remain application-owned. Role display names are never authorization inputs.

Before production deployment, move PostgreSQL's physical data directory outside the application repository tree. The current location is a local-development convenience, not an acceptable production layout.
