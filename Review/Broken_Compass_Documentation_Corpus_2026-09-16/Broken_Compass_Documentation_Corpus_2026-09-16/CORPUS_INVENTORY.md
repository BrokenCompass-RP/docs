# Broken Compass Documentation Corpus Inventory

Collection date: 2026-09-16  
Source documentation directory: `server-data/docs`  
Collection rule: copied without rewriting, renaming, normalizing, or consolidating source material.

## Summary

- Total documents/reference files discovered: **28**
- Source file types discovered: **Markdown (`.md`): 19; CSV (`.csv`): 1; plain text (`.txt`): 1; patch (`.patch`): 1; XML (`.xml`): 6**
- Total local assets discovered and collected: **2** (`.png`: 1; `.svg`: 1)
- Files excluded for potential sensitivity: **0**
- Broken or missing local asset references: **0**
- Exact byte-for-byte duplicate files: **0**
- Obvious duplicate/overlapping-document candidates: **8 groups** (architecture; QA; HUD; commands/controls; development/process guidance; and three original/cleaned XML pairs)
- File types that could not be inspected: **None**. Markdown, CSV, text, patch, and XML were inspected as text; all six XML files parsed successfully; the CSV loaded successfully; the PNG and SVG were visually reviewed.
- Total source-document size: **approximately 1.71 MiB** (1,790,731 bytes)
- Total referenced-asset size: **approximately 140.8 KiB** (144,141 bytes)

### Safety review

The source collection was scanned for obvious passwords, API keys, Discord bot tokens/webhooks, OAuth/client secrets, credential-bearing connection strings, private-key material, email addresses, IP addresses, user-profile paths, and other obvious personal or operational identifiers. No exclusion-worthy match was found. Numeric strings that initially resembled phone numbers were confined to XML geometry, GUID, hash, and bounding-volume values. The two referenced visual assets contain generic game/UI artwork and no apparent personal information.

### Collection layout

- `docs/` mirrors the complete original `server-data/docs` tree.
- `resources/` contains the two repository-local visual assets explicitly referenced by the documentation, at their repository-relative paths.
- This inventory is new collection metadata and is not copied from or added to the original `docs` directory.

## Document inventory

### `ARCHITECTURE.md`

- Original relative path: `ARCHITECTURE.md`
- Filename: `ARCHITECTURE.md`
- File type: Markdown
- Approximate size: 5.5 KiB
- Apparent subject: Broken Compass resource architecture, communication, configuration, and code ownership principles
- Apparent document type: Architecture guide
- Apparent audience: Developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps `server-architecture.md`, `CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`, and parts of the HUD architecture set
- Potentially stale: Unclear; principles are undated and repository-specific
- Ownership apparent: BCRP project ownership is implied; individual document owner is unclear
- Structural oddities: Heading levels move between H1 and H2 for peer sections

### `BCRP_PHOTO_DEPLOYMENT.md`

- Original relative path: `BCRP_PHOTO_DEPLOYMENT.md`
- Filename: `BCRP_PHOTO_DEPLOYMENT.md`
- File type: Markdown
- Approximate size: 10.8 KiB
- Apparent subject: CSI/evidence-photo deployment, migrations, Cloudflare worker, startup order, testing, rollback, and sign-off
- Apparent document type: Deployment runbook/checklist
- Apparent audience: Developers and server administrators/operators
- Referenced local assets: `resources/[ox]/ox_inventory/web/images/printed_photo.png` (collected)
- Overlap/duplicate: No obvious near-duplicate; related operationally to architecture and QA documents
- Potentially stale: Unclear; deployment paths and generated-bundle hashes are implementation-dependent
- Ownership apparent: BCRP forensics/photo subsystem is apparent; individual owner is unclear
- Structural oddities: Mixes authoritative flow, deployment procedure, smoke tests, rollback, and sign-off in one file

### `bcrp_qa_testing_checklist.csv`

- Original relative path: `bcrp_qa_testing_checklist.csv`
- Filename: `bcrp_qa_testing_checklist.csv`
- File type: CSV
- Approximate size: 22.6 KiB
- Apparent subject: Repository-wide server and gameplay QA scenarios
- Apparent document type: Import-ready test checklist/tracking sheet
- Apparent audience: QA testers, developers, staff, and administrators
- Referenced local assets: None apparent
- Overlap/duplicate: Direct companion to `bcrp_testing_coverage_report.md`; also overlaps validation items in several system-specific documents
- Potentially stale: Potentially; resource lists and expected behavior reflect a repository snapshot
- Ownership apparent: Unclear
- Structural oddities: 71 data rows; result/tracking columns are intentionally mostly blank and preserve incomplete testing state

### `bcrp_testing_coverage_report.md`

- Original relative path: `bcrp_testing_coverage_report.md`
- Filename: `bcrp_testing_coverage_report.md`
- File type: Markdown
- Approximate size: 6.1 KiB
- Apparent subject: QA coverage counts, priorities, risks, and deliverables
- Apparent document type: Generated coverage report
- Apparent audience: QA leads, developers, and project administrators
- Referenced local assets: `docs/bcrp_qa_testing_checklist.csv` (already present in the mirrored `docs/` tree)
- Overlap/duplicate: Direct companion/summary for `bcrp_qa_testing_checklist.csv`
- Potentially stale: Yes; explicitly generated from a read-only inspection on 2026-06-30
- Ownership apparent: Unclear
- Structural oddities: Summary report points to a CSV whose test-result fields remain separate

### `bcrp-hud-backlog.md`

- Original relative path: `bcrp-hud-backlog.md`
- Filename: `bcrp-hud-backlog.md`
- File type: Markdown
- Approximate size: 20.6 KiB
- Apparent subject: Phased BCRP HUD engineering backlog, dependencies, status, and acceptance criteria
- Apparent document type: Engineering backlog/roadmap
- Apparent audience: HUD developers, technical leads, and testers
- Referenced local assets: None apparent
- Overlap/duplicate: Strongly overlaps the HUD data-contract, resource-map, UI-audit, and phase-1 validation documents
- Potentially stale: Potentially; contains completed, partial, planned, deferred, and validation-required states
- Ownership apparent: BCRP HUD resource/team is apparent; individual owner is unclear
- Structural oddities: Roadmap and historical completion record coexist; unresolved/deferred work is intentionally retained

### `bcrp-hud-data-contract.md`

- Original relative path: `bcrp-hud-data-contract.md`
- Filename: `bcrp-hud-data-contract.md`
- File type: Markdown
- Approximate size: 17.7 KiB
- Apparent subject: Lua-to-NUI HUD actions, payload fields, callbacks, cadence, ownership, normalization, and compatibility
- Apparent document type: Interface/data-contract reference
- Apparent audience: HUD and integration developers
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps `bcrp-hud-resource-map.md`, `bcrp-hud-ui-audit.md`, and backlog contract items
- Potentially stale: Potentially; tightly coupled to current runtime and frontend implementations
- Ownership apparent: Resource-level ownership is documented; individual document owner is unclear
- Structural oddities: Records both legacy and normalized fields, including conflicting types/sentinels and explicit deferrals

### `bcrp-hud-phase-1-validation.md`

- Original relative path: `bcrp-hud-phase-1-validation.md`
- Filename: `bcrp-hud-phase-1-validation.md`
- File type: Markdown
- Approximate size: 2.7 KiB
- Apparent subject: Phase-1 HUD startup, display, vehicle, minimap, money, lifecycle, and performance validation
- Apparent document type: Validation checklist/test record
- Apparent audience: Developers and QA testers
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps HUD backlog acceptance criteria and the general QA checklist
- Potentially stale: Potentially; phase-specific checklist with an incomplete test-record section
- Ownership apparent: BCRP HUD context is apparent; tester/owner is unclear
- Structural oddities: Checklist and blank test record preserve incomplete validation state

### `bcrp-hud-resource-map.md`

- Original relative path: `bcrp-hud-resource-map.md`
- Filename: `bcrp-hud-resource-map.md`
- File type: Markdown
- Approximate size: 29.5 KiB
- Apparent subject: HUD resource tree, file responsibilities, runtime sections, interfaces, polling, and ownership
- Apparent document type: Developer resource map/technical reference
- Apparent audience: HUD developers and maintainers
- Referenced local assets: `resources/[bcrp]/bcrp-hud/html/brand-logo.svg` (collected)
- Overlap/duplicate: Strong overlap with the HUD data contract, UI audit, and backlog
- Potentially stale: Potentially; includes line-range and file-layout references that drift with code
- Ownership apparent: File and runtime ownership are extensively described; individual document owner is unclear
- Structural oddities: Combines tree listing, line-number map, ownership tables, event map, and implementation notes

### `bcrp-hud-ui-audit.md`

- Original relative path: `bcrp-hud-ui-audit.md`
- Filename: `bcrp-hud-ui-audit.md`
- File type: Markdown
- Approximate size: 37.3 KiB
- Apparent subject: UI-producing resources, HUD redundancy, state ownership, and migration/visibility concerns
- Apparent document type: Technical audit
- Apparent audience: Developers, architects, and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Strongly overlaps the HUD resource map, data contract, backlog, and broader health audit
- Potentially stale: Potentially; findings depend on the inspected resource tree and runtime configuration
- Ownership apparent: State/resource ownership is analyzed; individual document owner is unclear
- Structural oddities: Preserves unresolved dependencies, recommendations, and a large decision table in one document

### `CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`

- Original relative path: `CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`
- Filename: `CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`
- File type: Markdown
- Approximate size: 57.8 KiB
- Apparent subject: Repository health, performance risks, runtime switches, optimization work, validation, and historical findings
- Apparent document type: Engineering audit/status record
- Apparent audience: Developers, technical leads, and server operators
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps architecture, HUD audit/backlog, QA, and system-specific reviews
- Potentially stale: Mixed by design; a 2026-09-09 current snapshot explicitly supersedes a retained 2026-07-20 historical baseline
- Ownership apparent: BCRP engineering context is apparent; individual owner is unclear
- Structural oddities: Current and superseded historical material intentionally coexist in the same file

### `coding-standards.md`

- Original relative path: `coding-standards.md`
- Filename: `coding-standards.md`
- File type: Markdown
- Approximate size: 8.2 KiB
- Apparent subject: Code organization, naming, vendor protection, compatibility, testing, review, and ownership conventions
- Apparent document type: Coding standards/policy
- Apparent audience: Developers and reviewers
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps `cody-instructions.md`, `development-workflow.md`, and architecture principles
- Potentially stale: Unclear; undated policy with repository-specific guidance
- Ownership apparent: Broken Compass project/team is apparent; individual owner is unclear
- Structural oddities: Long checklist-like policy with uneven heading hierarchy

### `cody-instructions.md`

- Original relative path: `cody-instructions.md`
- Filename: `cody-instructions.md`
- File type: Markdown
- Approximate size: 3.5 KiB
- Apparent subject: Instructions and priorities for a coding agent working on Broken Compass RP
- Apparent document type: Agent/developer operating instructions
- Apparent audience: Coding agents and supervising developers
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps coding standards, development workflow, and architecture guidance
- Potentially stale: Unclear; tied to current repository practices and tooling
- Ownership apparent: Project role context is apparent; document maintainer is unclear
- Structural oddities: Human project rules, review expectations, deployment awareness, and agent communication style are combined

### `COMMANDS_AND_KEYBINDS.md`

- Original relative path: `COMMANDS_AND_KEYBINDS.md`
- Filename: `COMMANDS_AND_KEYBINDS.md`
- File type: Markdown
- Approximate size: 33.3 KiB
- Apparent subject: Player, staff/admin, developer/debug commands, keybinds, resource ownership, and audit findings
- Apparent document type: Consolidated command/keybind inventory and audit
- Apparent audience: Players, staff, administrators, developers, and maintainers
- Referenced local assets: `Controls/commands.md` and `Controls/controls.md` (both present); no binary assets
- Overlap/duplicate: Strongly overlaps all three `Controls/` documents and `commands-and-hotkeys.md`; explicitly takes precedence where older inventories disagree
- Potentially stale: No obvious stale marker; dated repository scope and runtime registrations can drift
- Ownership apparent: Command/resource ownership is documented; individual document owner is unclear
- Structural oddities: Multiple audiences and access levels share one file; contains conflicts, inactive registrations, and audit notes

### `commands-and-hotkeys.md`

- Original relative path: `commands-and-hotkeys.md`
- Filename: `commands-and-hotkeys.md`
- File type: Markdown
- Approximate size: 7.3 KiB
- Apparent subject: Historical commands/default hotkeys and inactive upstream HUD references
- Apparent document type: Historical inventory/reference
- Apparent audience: Developers, maintainers, and administrators
- Referenced local assets: `COMMANDS_AND_KEYBINDS.md` and all three `Controls/` Markdown files (all present)
- Overlap/duplicate: Strongly overlaps the consolidated command/keybind inventory and `Controls/` files
- Potentially stale: Yes; explicitly historical and dated 2026-07-30
- Ownership apparent: Resource ownership appears in rows; individual document owner is unclear
- Structural oddities: Contains explicit inactive-upstream material and caveats preserved for historical comparison

### `Controls/commands.md`

- Original relative path: `Controls/commands.md`
- Filename: `commands.md`
- File type: Markdown
- Approximate size: 34.4 KiB
- Apparent subject: Player-facing commands, permissions, parameters, effects, and resource paths
- Apparent document type: Command inventory/reference
- Apparent audience: Players, staff, administrators, developers, and maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Strongly overlaps `COMMANDS_AND_KEYBINDS.md` and `commands-and-hotkeys.md`
- Potentially stale: Yes/likely; the consolidated inventory labels the older `Controls/` tables as historical cross-checks with drift
- Ownership apparent: Per-command resource ownership is apparent; individual document owner is unclear
- Structural oddities: Very large tables mix player-facing behavior with implementation locations and access restrictions

### `Controls/controls.md`

- Original relative path: `Controls/controls.md`
- Filename: `controls.md`
- File type: Markdown
- Approximate size: 20.1 KiB
- Apparent subject: Player-facing keybind/control registrations by resource
- Apparent document type: Keybind inventory/reference
- Apparent audience: Players, developers, maintainers, and support staff
- Referenced local assets: None apparent
- Overlap/duplicate: Strongly overlaps `COMMANDS_AND_KEYBINDS.md`, `commands-and-hotkeys.md`, and `Controls/undocumented-controls.md`
- Potentially stale: Yes/likely; contains an explicitly inactive `qbx_hud` reference and is treated as a historical cross-check by the consolidated inventory
- Ownership apparent: Per-control resource ownership is apparent; individual document owner is unclear
- Structural oddities: Active and inactive reference rows coexist; tables blend defaults, gating conditions, and implementation callbacks

### `Controls/undocumented-controls.md`

- Original relative path: `Controls/undocumented-controls.md`
- Filename: `undocumented-controls.md`
- File type: Markdown
- Approximate size: 13.2 KiB
- Apparent subject: Hidden/direct controls, undocumented commands, duplicate keybinds, conflicts, and unused registrations
- Apparent document type: Audit notes/gap inventory
- Apparent audience: Developers, maintainers, and documentation owners
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps the other `Controls/` inventories and the consolidated command/keybind audit
- Potentially stale: Potentially; findings depend on current registrations and configuration
- Ownership apparent: Resource-level ownership is often visible; documentation owner is unclear
- Structural oddities: Intentionally inventories uncertain, generated, conflicting, and possibly unused behavior

### `development-workflow.md`

- Original relative path: `development-workflow.md`
- Filename: `development-workflow.md`
- File type: Markdown
- Approximate size: 5.0 KiB
- Apparent subject: Team roles, repository documentation, branches, workflow, and current working practices
- Apparent document type: Development-process guide
- Apparent audience: Project leads, developers, reviewers, and coding agents
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps coding standards, Cody instructions, and architecture/process guidance
- Potentially stale: Potentially; includes a “Current Reality” section and named team/tool roles
- Ownership apparent: Team roles are named; document ownership/maintainer is unclear
- Structural oddities: Recommended workflow and acknowledged current practice coexist

### `reflective-codewalker-commands-2026-07-31.txt`

- Original relative path: `reflective-codewalker-commands-2026-07-31.txt`
- Filename: `reflective-codewalker-commands-2026-07-31.txt`
- File type: Plain text
- Approximate size: 80.8 KiB
- Apparent subject: Verbatim PowerShell/CodeWalker investigative commands from a recorded Codex session
- Apparent document type: Command transcript/research provenance record
- Apparent audience: Developers investigating GTA V map/YTYP/YMAP data
- Referenced local assets: No collected local visual assets; contains external URLs and local/tool paths as command inputs
- Overlap/duplicate: Related to the paired vendor-source XML backups; no obvious duplicate transcript
- Potentially stale: Yes; dated 2026-07-31 and records a specific tool/session environment
- Ownership apparent: Codex session provenance is stated; long-term document owner is unclear
- Structural oddities: Raw, numbered, verbatim command history rather than narrative documentation; preserves absolute project/tool paths

### `server-architecture.md`

- Original relative path: `server-architecture.md`
- Filename: `server-architecture.md`
- File type: Markdown
- Approximate size: 17.8 KiB
- Apparent subject: Server runtime files, custom/vendor resource groups, event flow, risks, and recommendations
- Apparent document type: Architecture overview/audit
- Apparent audience: Developers, architects, and server administrators
- Referenced local assets: None apparent
- Overlap/duplicate: Strongly overlaps `ARCHITECTURE.md` and `CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`; also touches system-specific audits
- Potentially stale: Potentially; resource inventory and recommendations depend on repository state
- Ownership apparent: Resource categories and some ownership are described; individual document owner is unclear
- Structural oddities: Mixes descriptive architecture with audit findings and proposed future documentation

### `vehicle-lifecycle-impound-architecture-review-2026-08-01.md`

- Original relative path: `vehicle-lifecycle-impound-architecture-review-2026-08-01.md`
- Filename: `vehicle-lifecycle-impound-architecture-review-2026-08-01.md`
- File type: Markdown
- Approximate size: 34.3 KiB
- Apparent subject: Vehicle ownership/state lifecycle, garages, police/MDT impound, fees, conflicts, and release paths
- Apparent document type: System architecture review/audit
- Apparent audience: Developers, architects, police/MDT integrators, and server administrators
- Referenced local assets: None apparent
- Overlap/duplicate: Overlaps the general architecture/health audits and vehicle test coverage in the QA checklist
- Potentially stale: Yes/likely; dated 2026-08-01 and closely tied to installed resource implementations
- Ownership apparent: Competing resource authorities are analyzed; a single canonical owner is explicitly not always clear
- Structural oddities: Intentionally preserves conflicting state semantics, legacy paths, and unresolved authority boundaries

### `vendor-patches/npwd-3.15.1-beta.2-player-unload.patch`

- Original relative path: `vendor-patches/npwd-3.15.1-beta.2-player-unload.patch`
- Filename: `npwd-3.15.1-beta.2-player-unload.patch`
- File type: Unified diff/patch
- Approximate size: 3.4 KiB
- Apparent subject: NPWD player unload concurrency/idempotency changes
- Apparent document type: Vendor patch/reference artifact
- Apparent audience: Developers and vendor-update maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: No obvious duplicate; related to vendor-update and architecture/maintenance guidance
- Potentially stale: Potentially; explicitly tied to NPWD version `3.15.1-beta.2`
- Ownership apparent: Upstream file/resource is apparent; patch author/maintainer is unclear
- Structural oddities: Raw patch stored inside documentation rather than prose; version-specific context is encoded in the filename

### `vendor-source-backups/moreo_pharmacy/moreo_pharmacy.ytyp.cleaned.xml`

- Original relative path: `vendor-source-backups/moreo_pharmacy/moreo_pharmacy.ytyp.cleaned.xml`
- Filename: `moreo_pharmacy.ytyp.cleaned.xml`
- File type: XML
- Approximate size: 467.9 KiB
- Apparent subject: Cleaned CodeWalker/YTYP-style archetype and entity metadata for the Moreo pharmacy asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `moreo_pharmacy.ytyp.original.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear; backup has no clear lifecycle marker beyond `cleaned`
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Large generated-looking XML with a hash-like root element; stored under docs as source backup

### `vendor-source-backups/moreo_pharmacy/moreo_pharmacy.ytyp.original.xml`

- Original relative path: `vendor-source-backups/moreo_pharmacy/moreo_pharmacy.ytyp.original.xml`
- Filename: `moreo_pharmacy.ytyp.original.xml`
- File type: XML
- Approximate size: 477.9 KiB
- Apparent subject: Original CodeWalker/YTYP-style archetype and entity metadata for the Moreo pharmacy asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `moreo_pharmacy.ytyp.cleaned.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear; backup has no clear capture date or version in the filename
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Large generated-looking XML with a hash-like root element; original and cleaned variants are preserved side by side

### `vendor-source-backups/qua_delperroproject/qua_247_int.ytyp.cleaned.xml`

- Original relative path: `vendor-source-backups/qua_delperroproject/qua_247_int.ytyp.cleaned.xml`
- Filename: `qua_247_int.ytyp.cleaned.xml`
- File type: XML
- Approximate size: 94.5 KiB
- Apparent subject: Cleaned CodeWalker/YTYP-style metadata for the Del Perro 24/7 interior asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `qua_247_int.ytyp.original.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Generated-looking XML with a hash-like root element and paired original/cleaned variants

### `vendor-source-backups/qua_delperroproject/qua_247_int.ytyp.original.xml`

- Original relative path: `vendor-source-backups/qua_delperroproject/qua_247_int.ytyp.original.xml`
- Filename: `qua_247_int.ytyp.original.xml`
- File type: XML
- Approximate size: 95.1 KiB
- Apparent subject: Original CodeWalker/YTYP-style metadata for the Del Perro 24/7 interior asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `qua_247_int.ytyp.cleaned.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Generated-looking XML with a hash-like root element and paired original/cleaned variants

### `vendor-source-backups/qua_delperroproject/qua_delperro_barbers.ytyp.cleaned.xml`

- Original relative path: `vendor-source-backups/qua_delperroproject/qua_delperro_barbers.ytyp.cleaned.xml`
- Filename: `qua_delperro_barbers.ytyp.cleaned.xml`
- File type: XML
- Approximate size: 66.8 KiB
- Apparent subject: Cleaned CodeWalker/YTYP-style metadata for the Del Perro barbers asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `qua_delperro_barbers.ytyp.original.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Generated-looking XML with a hash-like root element and paired original/cleaned variants

### `vendor-source-backups/qua_delperroproject/qua_delperro_barbers.ytyp.original.xml`

- Original relative path: `vendor-source-backups/qua_delperroproject/qua_delperro_barbers.ytyp.original.xml`
- Filename: `qua_delperro_barbers.ytyp.original.xml`
- File type: XML
- Approximate size: 74.7 KiB
- Apparent subject: Original CodeWalker/YTYP-style metadata for the Del Perro barbers asset
- Apparent document type: Vendor-source backup/reference data
- Apparent audience: Map/interior developers and technical maintainers
- Referenced local assets: None apparent
- Overlap/duplicate: Paired with `qua_delperro_barbers.ytyp.cleaned.xml`; content overlaps but is not byte-identical
- Potentially stale: Unclear
- Ownership apparent: Vendor/project name is apparent; maintainer is unclear
- Structural oddities: Generated-looking XML with a hash-like root element and paired original/cleaned variants

## Referenced local asset inventory

### `resources/[ox]/ox_inventory/web/images/printed_photo.png`

- Filename: `printed_photo.png`
- File type: PNG image
- Approximate size: 35.9 KiB
- Referenced by: `docs/BCRP_PHOTO_DEPLOYMENT.md`
- Apparent subject: Generic crime-scene/printed-photo inventory artwork
- Apparent audience/use: Player-facing inventory UI asset
- Ownership apparent: `ox_inventory` resource path is apparent; artwork owner is unclear
- Safety result: Included; no apparent personal/private information

### `resources/[bcrp]/bcrp-hud/html/brand-logo.svg`

- Filename: `brand-logo.svg`
- File type: SVG containing an embedded PNG
- Approximate size: 104.9 KiB
- Referenced by: `docs/bcrp-hud-resource-map.md`
- Apparent subject: Qbox box/chick logo used by the HUD settings UI
- Apparent audience/use: Player-facing HUD/UI asset
- Ownership apparent: BCRP HUD resource path is apparent; artwork owner is unclear
- Safety result: Included; self-contained artwork with no apparent personal/private information or external fetch

## Exclusions

None.

## Broken or missing local references

None found among the explicit Markdown links and local image/file references inspected. External web URLs were not mirrored because they are not local repository assets.
