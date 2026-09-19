# Broken Compass Knowledge Base — Engineering Instructions

## About this project

This repository contains the Broken Compass RP permission-aware Knowledge Base.

This is NOT the legacy Mintlify documentation site.

The application is a custom Next.js knowledge system with PostgreSQL persistence,
Discord authentication, role-aware rendering, authoring, publishing, version
history, review workflows, browse navigation, search, and managed media.

Do not introduce Mintlify assumptions, MDX conventions, `docs.json`, or Mintlify
MCP workflows unless explicitly requested.

---

# Core product principle

Authorization happens before knowledge enters:

- rendering
- browse navigation
- search
- result existence
- result counts
- ranking
- snippets
- metadata
- citations
- asset delivery
- future AI context

Restricted information must not be sent to an unauthorized browser and hidden
with CSS.

For an unauthorized identity, restricted knowledge should effectively not exist.

This is a locked architectural requirement.

---

# Engineering approach

Diagnose before changing.

Preferred sequence:

1. Observe the behavior.
2. Inspect the current implementation.
3. Identify the responsible layer.
4. Form the smallest testable hypothesis.
5. Gather evidence.
6. Make the narrowest appropriate intervention.
7. Verify real behavior.
8. Report what changed and why.

Do not make speculative fixes.

If previously verified behavior stops working, treat it as a regression first.
Compare against the last known-good implementation before redesigning the
system.

Do not silently change product decisions because another implementation appears
cleaner.

If evidence challenges a locked decision or reveals a genuine product decision,
stop and report it.

---

# Change discipline

Unless explicitly requested:

- Do not commit.
- Do not merge.
- Do not push.
- Do not deploy.
- Do not perform unrelated cleanup.
- Do not expand task scope.
- Do not reorganize the taxonomy.
- Do not begin corpus migration.
- Do not rewrite unrelated documentation.

Preserve unrelated behavior.

Never claim verification that was not actually performed.

---

# Knowledge model

Canonical authored knowledge is Markdown.

Do not introduce a competing proprietary content representation.

Documents have stable identity independent of:

- physical source path
- browse location
- publication version

A document's stable UUID, slug, canonical URL, publication history, review
provenance, and draft history must survive browse-location changes.

H2 is the coherent section and visibility boundary.

H3 and deeper headings belong to their containing H2 section unless this product
decision is explicitly changed.

---

# Visibility model

Knowledge visibility is cumulative:

Public
→ Public

Moderator
→ Public + Moderator

Developer
→ Public + Moderator + Developer

Administrator
→ Public + Moderator + Developer + Administrator

Use explicit named grants.

Do not replace this model with numeric privilege comparisons.

Capabilities are separate from visibility.

Seeing content at a particular visibility level does not automatically grant
actions associated with that level.

---

# Discord authentication

Discord provides identity and role claims.

Broken Compass owns authorization policy.

Authorization inputs use immutable Discord IDs.

Never use these as authorization inputs:

- role names
- usernames
- display names

The verified production-shaped flow is:

Discord OAuth
→ Discord user ID
→ Broken Compass guild membership
→ immutable Discord role-ID snapshot
→ stable internal actor UUID
→ named application identity
→ Broken Compass visibility/capability policy

OAuth uses state validation and PKCE.

Discord access and refresh tokens must not be persisted.

Application session tokens are stored only as hashes.

Logout revokes the application session.

Repeated login must reuse the existing actor and external identity rather than
creating duplicates.

If this verified lifecycle fails, investigate it as a regression before changing
OAuth configuration, scopes, credentials, or authorization architecture.

---

# Development identity simulator

The development identity simulator is development-only.

It must remain structurally guarded by:

`NODE_ENV === "development"`

Production must not trust development identity cookies.

The simulator must remain separate from real Discord authorization.

View As is also not authentication.

View As may reduce the rendered projection but may never escalate beyond the
authenticated identity or change the actor's real capabilities.

---

# Persistence

PostgreSQL is the durable production-shaped persistence layer.

Production must never silently fall back to filesystem persistence.

Published versions are immutable.

Publication must atomically preserve:

- new immutable version
- current-version pointer
- draft removal

A failed publication must preserve the previous valid publication and retain the
draft.

Recovery creates a new publication event.

Recovery never modifies or deletes historical versions.

Do not invent historical publication dates. Unknown provenance must remain
unknown.

---

# Authoring

Developer and Administrator identities may manage documents through the Document
Manager.

Normal document authoring should not require:

- editing source code
- editing the content registry
- manually creating Markdown files
- understanding repository internals

The intended lifecycle is:

Create
→ Draft
→ Preview
→ Save
→ Publish
→ Revise
→ Publish new version
→ Recover if necessary

Draft content must not affect the current reader, browse tree, or search.

Browse-location changes are draft state and take effect on publication.

Preview must use the authoritative server-side visibility projection.

Do not render all preview content and hide restricted sections client-side.

---

# Browse taxonomy

Current provisional taxonomy:

- Getting Started
  - Jobs
- Community
- City & Services
- Departments
- Systems & Features
- Staff
- Development

The taxonomy is intentionally provisional.

Do not add, rename, remove, or reorganize categories unless explicitly requested.

Navigation must be built from authorized documents.

Unauthorized folder names, document titles, descriptions, URLs, counts, and
previews must not enter the client-visible browse model.

Empty folders disappear.

Staff and Development may be completely absent for identities without authorized
content inside them.

Browse location must not determine document identity.

---

# Search

Authorization occurs before search matching and ranking.

Unauthorized knowledge must not influence:

- whether a result exists
- term frequency
- score
- ranking
- counts
- snippets
- metadata

Search remains independent of browse placement.

Drafts must not appear in search.

---

# Managed images

Documentation supports managed images.

Current accepted formats:

- PNG
- JPEG
- GIF
- WebP

SVG and executable upload content are rejected.

Images require alt text.

Captions are optional.

Managed assets have stable UUIDs.

Published asset references participate in immutable publication history.

Replacing an image in a later publication must not alter earlier versions.

Asset authorization follows the authorization of the knowledge that references
the asset.

Do not expose restricted:

- asset bytes
- asset IDs
- filenames
- alt text
- captions
- existence metadata

through publicly retrievable asset URLs or unauthorized projections.

---

# Reviews

Review data is operational metadata, not canonical knowledge.

Flags, comments, and resolutions remain separate from:

- canonical Markdown
- immutable publication content
- reader projections
- search

Publishing or recovering a document does not automatically resolve a review.

Resolution is an explicit human action.

---

# Documentation migration

Migration does not mean copying old documentation into the new system.

Legacy documentation is source evidence.

For each source, determine whether it should:

- migrate directly
- be reconciled
- be merged
- be split
- be rewritten
- be archived or treated as superseded
- receive human review

Where documentation conflicts with the current Broken Compass implementation,
inspect the current implementation rather than arbitrarily choosing one
document.

Do not silently discard conflicts.

Known migration considerations:

- older Mechanic documentation is believed to be stale and must be reconciled
  against current behavior
- player-facing Controls and Commands overlap newer development audits and
  should not automatically be treated as authoritative
- Fence, Black Market Dealer, and Random Joe documentation is intentionally
  permitted to exist in the knowledge base
- a Phone Directory guide needs to be authored because many legacy instructions
  reference map markers while current service discovery is represented through
  the phone directory
- development-oriented source material has been intentionally moved under
  Development during corpus sorting

Do not begin bulk migration without an explicit task.

---

# UI requirements

Preserve the established Broken Compass visual language unless redesign is
explicitly requested.

Function and findability take priority over decorative complexity.

The global background artwork must NEVER tile or repeat.

Expected behavior:

`background-size: cover`
`background-repeat: no-repeat`
`background-position: center`

Use the established dark background color outside the image rather than repeating
the artwork.

Do not use color alone to communicate permissions or state.

---

# Security and secrets

Never print, log, report, commit, or reproduce:

- passwords
- database credentials
- complete credential-bearing database URLs
- Discord client secrets
- OAuth authorization codes
- OAuth state values
- PKCE verifiers
- Discord access tokens
- Discord refresh tokens
- plaintext application session tokens
- authentication cookie values

Use sanitized diagnostics.

Do not weaken security controls to make a test pass.

Fail closed when authorization state is uncertain.

---

# Verification expectations

Test boundaries, not only successful behavior.

For permission-sensitive work, verify both:

1. Authorized identities can access the information.
2. Unauthorized identities cannot infer that restricted information exists.

For stateful work, verify where applicable:

- initial state
- mutation
- persistence
- isolation
- reload/restart
- failure rollback
- recovery

Run the existing regression suite after changes.

Automated tests do not replace manual usability testing for human-facing
workflows.

A passing automated test suite does not justify claiming that a live integration
was verified when it was not exercised.

---

# Reporting

For substantial work, report:

1. Architecture or behavior implemented.
2. Files created.
3. Files changed.
4. Database migrations, if any.
5. Authorization/security effects.
6. Automated test results.
7. PostgreSQL integration results where applicable.
8. Production build result.
9. Live/manual verification actually performed.
10. Known limitations.
11. Assumptions challenged by evidence.
12. Product decisions requiring human input.

Never claim a checkpoint is VERIFIED if a required verification step remains
unperformed.

# Documentation writing style

When authoring or revising user-facing Broken Compass knowledge:

- Use active voice.
- Prefer second person ("you") for instructions.
- Keep sentences concise and task-focused.
- Use sentence case for headings.
- Bold UI controls and visible interface labels.
- Use code formatting for commands, resource names, file names, paths, and code references.
- Prefer language that tells the reader what to do or understand over implementation history.
- Do not expose internal technical detail in Public documentation unless it is necessary for the reader to complete the task.
- Preserve useful Broken Compass terminology rather than replacing it with generic technical language.