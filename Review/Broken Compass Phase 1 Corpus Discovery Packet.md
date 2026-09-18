# Broken Compass Knowledge System — Phase 1 Corpus Discovery & Validation Packet

**Phase:** 1 (Discovery & Validation only — no build, no deploy, no corpus modification)
**Scope:** Sections 1–7 as assigned. Sections 8+ were not provided in the assignment text and are not addressed here.
**Corpus modified:** No. All reading, extraction, and format-conversion work happened in a separate scratch workspace (`/home/user/workspace/corpus/`). The original `Documentation.zip` and its contents were not edited, renamed, merged, or reorganized.

**Evidence key:** 🔵 Observation (directly supported by corpus) · 🟡 Assumption (unverifiable, temporarily treated as likely) · 🟢 Recommendation · ❓ Open Question · 🔴 Risk

**Path convention:** Repo-derived files are cited as `docs/<path>` (relative to the nested repo export `Broken_Compass_Documentation_Corpus_2026-09-16/`). Google-Drive-derived files are cited by their exact `.docx` filenames as delivered (e.g. `Prison Guide BCRP.docx`), since that is the corpus's own naming.

---

## Corrections carried forward from Phase 0

Before the findings: two Phase 0 assumptions were flagged for correction and are treated as corrected inputs to this discovery pass, not re-litigated here:

- **Correction #1** — the visibility hierarchy is **Public → Moderator → Developer → Administrator** (strictly ordered, Administrator broadest), not co-equal Developer/Admin. Section 5 below tests this against the corpus.
- **Correction #2** — a Moderator-sensitive split is **not** assumed as a V1 requirement. It must be justified by real corpus evidence of "knowledge Moderators need but Developers should not read," and case/incident-style data must not be used to justify expanding the authorization model. Section 5 below reports the direct test result.

---

## Section 1 — Corpus Inventory

### 1.1 Two distinct source streams

🔵 The corpus is not one homogeneous collection — it is two separately-sourced streams bundled into one `Documentation.zip`:

- **Repo-derived stream**: a nested zip, `Documentation/Broken_Compass_Documentation_Corpus_2026-09-16.zip`, extracting to a `docs/` tree (28 files) plus a `resources/` folder (2 binary assets). This stream already contains its own prior inventory document, `CORPUS_INVENTORY.md`, produced by an earlier collection pass.
- **Google-Drive-derived stream**: 8 `.docx` "guide" documents sitting directly at the top level of `Documentation/`, with no accompanying folder structure, metadata, or index.

Per the assignment's instruction not to assume the repo is more authoritative, both streams are treated as evidence of equal standing below. The repo stream is more structurally rich (explicit versioning language, audience labels, supersession notes in several documents — see 1.4), but that is a documented behavior found in specific repo files, not a property to be assumed of the repo stream as a whole.

### 1.2 File counts and types

🔵 Per the repo's own `CORPUS_INVENTORY.md` (a pre-existing secondary inventory, cross-checked but **not** taken as authoritative per the assignment): the `docs/` tree contains 28 files — Markdown (`.md`): 19, CSV: 1, plain text (`.txt`): 1, patch (`.patch`): 1, XML (`.xml`): 6 — plus 2 binary assets (1 `.png`, 1 `.svg`) under `resources/`. 🟡 This is an *Assumption* insofar as it is one prior document's self-report; independently, direct traversal of the extracted tree in this session confirms the same 28-file count under `docs/` (`find … -type f | wc -l` → 28), which upgrades the count itself to 🔵 Observation, though the type breakdown was not independently re-tallied file-by-file.

🔵 The Google-Drive stream adds 8 `.docx` files: `Bay City Blue Apts Guide BCRP.docx`, `Building Manager Guide BCRP.docx`, `Community Creator Guide - BCRP.docx`, `Fire Basics Guide BCRP.docx`, `Mechanic Guide v1 BCRP.docx`, `Police Basics Guide BCRP.docx`, `Prison Guide BCRP.docx`, `Towing Job Guide BCRP.docx`.

🔵 Combined non-binary document count across both streams: 19 (.md) + 1 (.csv) + 1 (.txt) + 1 (.patch) + 6 (.xml) + 8 (.docx) = **36 document files**, plus at least 2 stand-alone binary assets in the repo stream and 67 embedded images across the 8 Drive guides (counted directly: 7 + 0 + 0 + 14 + 8 + 17 + 9 + 12).

### 1.3 Size is dominated by embedded media, not content

🔵 The 8 `.docx` files range from 12 KB (`Community Creator Guide - BCRP.docx`, 0 embedded images) to 28 MB (`Police Basics Guide BCRP.docx`, 17 embedded images), while their actual prose is short: word counts after clean Pandoc conversion range from 175 words (`Bay City Blue Apts Guide BCRP.docx`) to 826 words (`Community Creator Guide - BCRP.docx`). File size in this stream is almost entirely a function of embedded screenshot resolution, not information density — a naive "biggest file = most content" heuristic would badly mis-rank these documents.

🔵 By contrast, several repo `.md` files are dense pure text with no images: `docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md` (447 lines of tables and findings), `docs/coding-standards.md` (547 lines), `docs/bcrp-hud-ui-audit.md` (~5,021 words). The two streams are not comparable by file size or even word count alone; they represent different authoring conventions (screenshot-driven player walkthroughs vs. text-only technical prose).

### 1.4 Docs vs. structure

🔵 All 8 Drive guides sit in one flat, unstructured directory with no subfolders — audience, topic, and internal-vs-external content are not distinguished by placement at all (see 1.6 and Section 5 for `Building Manager Guide BCRP.docx`, which is a developer/QA document sitting undifferentiated among player guides).

🔵 The repo `docs/` tree has some structure — `docs/Controls/` (3 files) and `docs/vendor-patches/` (patch files) and `docs/vendor-source-backups/` (2 subfolders, `moreo_pharmacy/`, `qua_delperroproject/`, 6 XML files) — but the other 20+ files sit flat in `docs/` regardless of whether they are architecture guides, QA checklists, process docs, or feature-specific engineering reviews. Folder structure only weakly encodes topical or audience domains in this corpus (expanded in Section 2).

### 1.5 Broken/mismatched references

🔵 **Confirmed structural mismatch:** `docs/cody-instructions.md` and `docs/coding-standards.md` both instruct maintainers to document vendor modifications in `docs/vendor-patches.md` (a single Markdown file). The actual repo contains no such file — instead there is a `docs/vendor-patches/` **directory** holding raw `.patch` files, e.g. `docs/vendor-patches/npwd-3.15.1-beta.2-player-unload.patch`. The instructed target and the actual target are different things (a file vs. a directory of diffs), and the referenced file simply does not exist. This is a genuine broken-reference finding, not an inferred one — both source documents were read in full and the actual directory listing was independently confirmed.

🔵 **Confirmed unresolved placeholder:** `Prison Guide BCRP.docx` contains the literal, unreplaced authoring placeholder *"Insert image of police impound prompt"* as body text between two real images (converted Markdown, `Prison_Guide_BCRP.md` line 58). This indicates the document was published (or at least distributed as part of this corpus) before its own authoring checklist was finished.

### 1.6 Confirmed near-duplicate content (not byte-identical files, but byte-identical passages across different files)

🔵 `Mechanic Guide v1 BCRP.docx` and `Towing Job Guide BCRP.docx` share an almost word-for-word "How to get the job" section:

> "You can get the job at the City Services counter. If you don't have a vehicle you can /taxi and have it take you to the GPS marker you have. The marker is a white shield seen below. … You can always get the job back by coming here should you lose it somehow."

This sentence is byte-identical between the two guides; only the immediately following "Getting to the Job Area" paragraph diverges (different job-site location description — "north from the City Services Counter" for Mechanic vs. "near the airport south of the City Services counter and Vesucci Proper" for Towing).

🔵 `Fire Basics Guide BCRP.docx` and `Police Basics Guide BCRP.docx` share two entirely byte-identical sections, reordered relative to each other in the two documents: "Getting Vehicles" (Public Works purchase flow) and "Watercraft" (shared dock access, `/livery` command). This is copy-pasted shared infrastructure content across two sibling job guides, not a case of one subject split into authorized views — see Section 4 for why this is a distinct phenomenon from the canonical-subject/multiple-views hypothesis.

🔵 The repo's own `CORPUS_INVENTORY.md` independently flags "8 groups" of "obvious duplicate/overlapping-document candidates" (architecture; QA; HUD; commands/controls; development/process guidance; three XML original/cleaned pairs) and reports **zero** byte-for-byte duplicate *files*. This is consistent with what was independently found: duplication in this corpus is at the *passage* level within otherwise-distinct documents, not at the whole-file level. 🟡 The specific "8 groups" grouping itself is the prior inventory's own classification and is treated as an Assumption pending independent re-derivation, but its directional claim (duplication exists, no identical files) matches what was independently observed.

🔵 The vendor XML backups genuinely differ, not just cosmetically: diffing `docs/vendor-source-backups/moreo_pharmacy/moreo_pharmacy.ytyp.original.xml` against its `.cleaned.xml` counterpart shows entire `<Item type="CBaseArchetypeDef">` blocks (over 180 lines) present in the original and absent from the cleaned version, alongside an XML declaration encoding-case change (`UTF-8` → `utf-8`). These are meaningfully different artifacts, not a copy/rename pair.

### 1.7 Uninspectable / not independently rendered

🟡 The repo's `CORPUS_INVENTORY.md` claims all six XML files parsed successfully, the CSV loaded successfully, and the two binary assets (PNG, SVG) were visually reviewed, with "File types that could not be inspected: **None**." This was not independently re-verified for the binary assets in this session (no direct visual rendering of `printed_photo.png` or `brand-logo.svg` was performed here) — flagged as an Assumption inherited from the prior inventory, not a fresh Observation.

🔵 Independently confirmed in this session: all 8 `.docx` → Markdown conversions via Pandoc completed with **zero conversion errors**, and the CSV (`docs/bcrp_qa_testing_checklist.csv`, 72 rows) opened and displayed correctly as tabular text on direct inspection.

---

## Section 2 — Actual Knowledge Domains

Bottom-up candidate taxonomy, derived from what the corpus actually contains rather than an imposed structure:

1. **Player & Community Guides** — `Bay City Blue Apts Guide BCRP.docx`, `Fire Basics Guide BCRP.docx`, `Police Basics Guide BCRP.docx`, `Mechanic Guide v1 BCRP.docx`, `Towing Job Guide BCRP.docx`, `Prison Guide BCRP.docx`, `Community Creator Guide - BCRP.docx`. Player-facing, screenshot-heavy, informal tone.
2. **Server Architecture & Engineering** — `docs/ARCHITECTURE.md`, `docs/server-architecture.md`, `docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`.
3. **Team Process & AI-Assisted Workflow** — `docs/cody-instructions.md`, `docs/development-workflow.md`, `docs/coding-standards.md`.
4. **Commands & Controls Reference** — `docs/COMMANDS_AND_KEYBINDS.md` (canonical, explicitly supersedes the next three), `docs/commands-and-hotkeys.md` (self-declared historical), `docs/Controls/commands.md`, `docs/Controls/controls.md`, `docs/Controls/undocumented-controls.md`.
5. **QA & Testing** — `docs/bcrp_qa_testing_checklist.csv`, `docs/bcrp_testing_coverage_report.md`, `docs/bcrp-hud-phase-1-validation.md`.
6. **Feature Engineering Deep-Dives** — `docs/bcrp-hud-backlog.md`, `docs/bcrp-hud-data-contract.md`, `docs/bcrp-hud-resource-map.md`, `docs/bcrp-hud-ui-audit.md`, `docs/vehicle-lifecycle-impound-architecture-review-2026-08-01.md`, `docs/BCRP_PHOTO_DEPLOYMENT.md`.
7. **Vendor Management** — `docs/vendor-patches/npwd-3.15.1-beta.2-player-unload.patch`, `docs/vendor-source-backups/*` (6 XML files).
8. **Uncategorized / possible misfit** — `docs/reflective-codewalker-commands-2026-07-31.txt`.

### Subdomains and cross-cutting subjects

🔵 The "bcrp-hud" subject cross-cuts categories 4, 5, and 6: it has its own dedicated cluster (backlog, data contract, resource map, UI audit, phase-1 validation) but is also referenced from `docs/COMMANDS_AND_KEYBINDS.md` (as the owner of certain HUD-related commands) and appears as a resolved item in `docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`. It is a genuine multi-path subject, not cleanly assignable to one taxonomy node.

🔵 "Commands and keybinds" is a second cross-cutting/multi-path subject, spanning 5 files across categories 2 and 4 (development-workflow.md briefly references dev commands too).

🔵 "Vehicle impound" is a third cross-cutting subject, but — as detailed in Section 4 — it splits into two documents that do not actually describe the same underlying system, which is itself a finding, not just a taxonomy note.

### Misfits and folder-vs-taxonomy mismatches

🔵 `Building Manager Guide BCRP.docx` is filed alongside player guides by name and location but its actual content (ACE permission gating, "Developer Console" restart commands, an internal "Completion Summary" changelog) belongs in category 2 or 6, not category 1. This is a folder/taxonomy mismatch found directly in the document, not inferred (see Section 5 for full quotes).

🔵 `Community Creator Guide - BCRP.docx` contains a leftover editorial/suggestion passage written in first person and addressed to the document's owner, left inside the published body text (Markdown line 281): *"I would add one more thing that feels very 'Broken Compass'"* — followed by a list of suggested brand assets and closing commentary ("It also fits your broader philosophy that technology should support the experience, not become the experience."). This reads as an unremoved AI-assistant or reviewer suggestion, not player-facing content, sitting inside an otherwise player/creator-facing guide. It is evidence that this corpus's documents are not always cleanly finished at time of collection — consistent with the assignment's framing that the corpus's disorder is itself evidence.

🔴 `docs/reflective-codewalker-commands-2026-07-31.txt` does not fit any of the 8 candidate domains well — it is a raw, timestamped PowerShell/CodeWalker session transcript (77 commands) containing local, machine-specific absolute paths. It reads as personal tooling scratch output rather than organizational knowledge. See Section 5 for the recommendation to exclude or specially tag this file.

### Recommended smallest useful taxonomy

🟢 Six top-level domains cover the corpus without forcing artificial splits: **Player & Community Guides**, **Server Architecture & Engineering**, **Team Process & Workflow**, **Commands & Controls Reference**, **QA & Testing**, **Feature Engineering Deep-Dives** (with Vendor Management as a seventh, smaller domain, and the CodeWalker transcript flagged separately rather than forced into any domain). This is smaller than a fully audience-segmented taxonomy would suggest, because — as Section 5 shows — the corpus's real audience vocabulary is far simpler than a 4-tier hierarchy would require content for.

---

## Section 3 — Actual Document Types

Derived from evidence, not assumed from file extension alone:

| Document type | Examples | Distinguishing traits |
|---|---|---|
| Player Guide | `Fire Basics Guide BCRP.docx`, `Police Basics Guide BCRP.docx`, `Mechanic Guide v1 BCRP.docx`, `Towing Job Guide BCRP.docx`, `Prison Guide BCRP.docx`, `Bay City Blue Apts Guide BCRP.docx` | Informal tone, screenshot-driven, no author/date metadata (docx properties are stripped/generic), unresolved placeholders found |
| Community/Creator Guide | `Community Creator Guide - BCRP.docx` | Similar to Player Guide but audience is content creators; contains leftover reviewer/meta commentary |
| Architecture Guide | `docs/ARCHITECTURE.md`, `docs/server-architecture.md` | Principle-and-example prose, developer audience, includes a Mermaid diagram in `ARCHITECTURE.md` |
| Engineering Audit/Review Report | `docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md`, `docs/vehicle-lifecycle-impound-architecture-review-2026-08-01.md`, `docs/bcrp-hud-ui-audit.md` | Dated, ranked findings, explicit supersession language when re-run |
| Backlog/Ticket Tracker | `docs/bcrp-hud-backlog.md` | Status/priority-tagged item list |
| Technical/Data Contract | `docs/bcrp-hud-data-contract.md` | Interface/schema specification prose |
| Resource/File Map | `docs/bcrp-hud-resource-map.md` | File/line-level index of a resource |
| Validation Checklist | `docs/bcrp-hud-phase-1-validation.md` | Checkbox-style manual QA items |
| Structured QA Data | `docs/bcrp_qa_testing_checklist.csv` | Row-based, has empty "Tested By"/"Date Tested" columns — a living record, not finished prose |
| QA Narrative Report | `docs/bcrp_testing_coverage_report.md` | Prose companion to the CSV |
| Reference Inventory/Table | `docs/COMMANDS_AND_KEYBINDS.md`, `docs/Controls/commands.md`, `docs/Controls/controls.md`, `docs/Controls/undocumented-controls.md`, `docs/commands-and-hotkeys.md` | Large tables, explicit supersession chain among the 5 |
| Deployment/Runbook | `docs/BCRP_PHOTO_DEPLOYMENT.md` | Named secrets/env-vars, migration + rollback steps |
| Process/Policy Doc | `docs/cody-instructions.md`, `docs/coding-standards.md`, `docs/development-workflow.md` | Rules and working philosophy, reveal the solo-developer team structure |
| Vendor Patch | `docs/vendor-patches/npwd-3.15.1-beta.2-player-unload.patch` | Raw unified diff, not prose |
| Vendor Source Backup | `docs/vendor-source-backups/*/*.xml` (6 files, 3 original/cleaned pairs) | Large generated game-engine metadata, not prose (one file's diff spans 13,000+ lines) |
| Raw Session Transcript | `docs/reflective-codewalker-commands-2026-07-31.txt` | Verbatim timestamped tool log with local machine paths |
| Meta-Inventory | `docs/CORPUS_INVENTORY.md` | A document *about* the other documents, produced by a prior collection pass |

🔵 These types genuinely need different metadata, lifecycle, and rendering treatment:

- **Player Guides** have no captured author/date/version metadata at all (Word document properties were blank or generic on inspection) — the biggest lifecycle gap in the corpus, since these are exactly the documents most likely to drift out of date as gameplay systems change.
- **Audit/Review Reports** and **Reference Inventories** already self-manage supersession *in prose* (`docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md` layers newer findings over an explicitly retained older baseline; `docs/COMMANDS_AND_KEYBINDS.md` explicitly states it supersedes three other files) — a real system should formalize a supersedes/superseded-by field rather than rely on readers finding the prose disclaimer.
- **Structured QA Data** (the CSV) needs tabular, editable rendering and per-row ownership (a QA tester owns a row's Pass/Fail state), which is a different ownership model than document-level authorship.
- **Vendor Patch** and **Vendor Source Backup** files are not prose at all and need code/diff rendering or to simply remain linked attachments — see Section 6.
- **Raw Session Transcript** needs to be treated as a log/artifact rather than living documentation, if it is kept in the system at all.

---

## Section 4 — Testing "One Canonical Subject, Multiple Authorized Views"

The hypothesis is explicitly an authoring/content-model principle to test, not an absolute rule. Two real multi-document subjects were tested against the 8-factor framework (same subject / same reader-task family / same lifecycle / same-or-compatible ownership / similar cadence / would users expect them together / would combining be confusing / would separating create duplicate authoritative explanations), actively seeking falsifying evidence as instructed.

### Case A — Vehicle impound (falsifying evidence)

Documents: `Prison Guide BCRP.docx` (one short player-facing passage) vs. `docs/vehicle-lifecycle-impound-architecture-review-2026-08-01.md` (a full technical review of **three separate, partially conflicting** backend implementations — `qbx_garages`, `qbx_police`, and `ps-mdt` — with KEEP/CHANGE/DEPRECATE/REMOVE recommendations per system). The two documents never reference each other.

🔵 Applying the framework:
- *Same subject?* Only nominally. The architecture review reveals the underlying implementation is **not yet unified** across three systems — so there isn't a single canonical subject to split views of; there's a player-facing fiction of unity sitting atop real backend fragmentation.
- *Same reader-task family?* No — a player wants "how do I get my car back"; a developer wants "which of three conflicting systems is authoritative, and how do we consolidate them."
- *Same lifecycle?* No — the guide passage is roughly evergreen prose; the architecture review is a dated, phase-tied migration-planning document.
- *Same/compatible ownership?* Different in practice — the guide belongs to onboarding content; the review belongs to the solo technical lead's engineering track.
- *Would users expect them together?* No.
- *Would combining be confusing?* Yes — burying player instructions inside a three-system architectural conflict analysis would make the player content unusable.
- *Would separating create duplicate authoritative explanations?* No — the two documents do not even agree on what "the" impound system is, so separating them doesn't fragment one authority; it correctly reflects that no single authoritative system exists yet.

🔵 **Conclusion:** this is genuine falsifying evidence against treating "vehicle impound" as one subject with multiple authorized views. It is closer to two different subjects (player-facing flavor text; pre-consolidation technical audit) that happen to share a noun.

### Case B — bcrp-hud resource cluster (supporting evidence, with an important nuance)

Documents: `docs/bcrp-hud-backlog.md`, `docs/bcrp-hud-data-contract.md`, `docs/bcrp-hud-resource-map.md`, `docs/bcrp-hud-ui-audit.md`, `docs/bcrp-hud-phase-1-validation.md`.

🔵 Applying the framework: same subject (yes — all describe the same `bcrp-hud` resource replacing `qbx_hud`); same reader-task family (yes — all developer/QA tasks, no player-facing content in this cluster); roughly same lifecycle (phase numbers recur consistently across the backlog and validation docs); same ownership (yes — the solo technical owner per `docs/development-workflow.md`); users would expect them linked together for HUD work, but would find one 5,000+-word merged monolith unusable; no contradictory explanations were found between the five documents.

🟢 **Conclusion:** this supports "one canonical subject, multiple documents" — but the correct granularity here is **multiple document *types* for a single audience** (backlog vs. contract vs. map vs. audit vs. checklist, all developer/QA-facing), not multiple *audience-restricted sections* of one file. This is an important distinction from what the assignment's hypothesis is really testing (audience-gated views), and it should not be conflated with the access-block use case in Section 7.

### Case C — Commands & Controls cluster (a different, non-audience kind of multiplicity)

🔵 `docs/COMMANDS_AND_KEYBINDS.md` explicitly states it supersedes `docs/Controls/commands.md`, `docs/Controls/controls.md`, and `docs/commands-and-hotkeys.md` where they disagree; `docs/commands-and-hotkeys.md` independently self-identifies as historical. This is a **temporal/version-precedence split**, not an audience split — falsifying evidence that not every same-noun multi-file case is about authorized views. Some of it is simply uncleaned version history, consistent with the assignment's framing that the corpus's disorder is evidence in itself.

### A distinct duplication phenomenon (not covered by the hypothesis at all)

🔵 The Mechanic/Towing and Fire/Police duplicate passages found in Section 1.6 are **not** one subject split into authorized views — they are identical boilerplate copy-pasted across two genuinely *different* subjects (two different jobs) that happen to share physical game-world infrastructure (the same City Services counter, the same docks). The corpus's actual duplication problem is mostly this kind of cross-sibling boilerplate copying, not the same-subject/multiple-views pattern the hypothesis targets. 🟡 This is worth flagging as a distinct authoring problem the "one canonical subject" principle does not, by itself, solve.

---

## Section 5 — Testing Audience/Access Boundaries

### The central finding: "Moderator" has zero footprint in the corpus

🔵 A corpus-wide case-insensitive search for "moderator" across every extracted repo file and every converted Drive guide returned **zero matches**. This is the single most decisive piece of evidence for Correction #2: the corpus currently contains no organizational knowledge that is labeled for, written for, or evidently intended for a "Moderator" role or audience — because the term and the associated concept do not appear anywhere in the actual documentation.

🔵 The corpus's real in-game permission/role vocabulary is different and should not be conflated with a documentation-audience hierarchy: `docs/COMMANDS_AND_KEYBINDS.md` gates specific commands behind a "Staff group" (`mod` ACE), an "Admin group" (`admin` / `group.admin` ACE), and a "Developer" tier (`dev` ACE). These are **FiveM ACE permission tiers controlling who can run a command at runtime** — an entirely different axis from "who is allowed to read a piece of documentation." No document in the corpus states that any content is readable by Moderators/Staff but not by Developers, or vice versa.

🟡 The secondary `CORPUS_INVENTORY.md` uses "administrator" only as a general audience label (grouped with "staff, developers, maintainers"), never as a standalone documentation-visibility tier — this is an Assumption about that document's intent, not a definitive design statement.

🔵 No case/incident/disciplinary content of any kind was found anywhere in the corpus — no "Player Incident #NNNN"-style records, ban/appeal logs, or HR-like material. The Phase 0 worked example built around such a record was a hypothetical illustration, not something derived from this real corpus; its absence here directly confirms Correction #2's caution was warranted.

🟢 **Recommendation:** retain the simpler, corrected hierarchy (Public → Moderator → Developer → Administrator as a read-visibility ordering) without adding a "Moderator-sensitive, hidden-from-Developer" content split in V1. There is currently no corpus evidence to justify one. If genuine moderator-specific knowledge-base content is authored later, this should be revisited then — and per the assignment's explicit product-boundary guidance, case-management-style content (like the hypothetical Incident #18372) likely belongs in a separate system entirely, not in this knowledge base's authorization model.

### Real mixed-audience anomaly found in the corpus

🔵 `Building Manager Guide BCRP.docx` sits among player guides by name and location, but its body contains genuine developer/ops content:

> "Building Manager commands (/buildings and /buildingmanager) and all administrative callbacks are protected by the ACE permission 'bcrp.propertytools'."

> "# Developer Console — restart bcrp-propertytools — Reload Building Manager backend. … restart bcrp-phone-property-finder — Reload NPWD Property Finder. … ensure bcrp-propertytools — Start the resource if stopped."

> "# Completion Summary — Revision contract repaired. — Boolean normalization repaired. — Office publication verified."

This is one physical document straddling two real audiences (a general "how buildings work" framing, plus developer/ops console commands and an internal QA changelog). It is direct evidence that mixed-audience documents genuinely occur in this corpus — but note this is a Developer/general-audience mix, not a Moderator-specific split.

🔵 Boundary-to-structure alignment differs by document: in `docs/COMMANDS_AND_KEYBINDS.md`, audience boundaries align cleanly with explicit heading labels (Player commands / Player keybinds / Staff and admin commands / Developer and debug commands) — a reader can tell where the audience shifts. In `Building Manager Guide BCRP.docx`, the shift to developer/ops content is marked by headings ("# Security", "# Developer Console") but those headings do not themselves say "developer-only" — a casual player-guide reader has no explicit signal to stop reading there, unlike in `COMMANDS_AND_KEYBINDS.md`.

### Content that plausibly should not be in a knowledge system at all

🔴 `docs/reflective-codewalker-commands-2026-07-31.txt` is a raw, timestamped tool session log containing local, machine-specific absolute paths (e.g. under `E:\Broken Compass RP\...` and `E:\SteamLibrary\...`). This is not organizational knowledge in the sense the assignment cares about — it is personal-machine tooling debris. 🟢 **Recommendation:** exclude it from the V1 taxonomy, or at minimum tag it as a non-canonical raw log rather than living documentation. This is a scope/fit question, not a security concern.

🔵 `docs/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md` and `docs/BCRP_PHOTO_DEPLOYMENT.md` both name real operational secrets (`SCREENSHOT_BASIC_TOKEN`, `NPWD_AUDIO_TOKEN` in the first; `BCRP_SERVER_SECRET`, `UPLOAD_TOKEN_SECRET` in the second) by variable name, without leaking actual secret values into the corpus text. Per the assignment's explicit constraint, these are legitimate Developer-tier operational-engineering knowledge and must **not** be used to justify expanding the authorization model — they are exactly the kind of content the assignment warned against over-generalizing from. They belong to the Deployment/Runbook and Engineering Audit document types (Section 3), scoped to Developer/Administrator visibility, and nothing more.

---

## Section 6 — Testing the Markdown Hypothesis

🔵 The 19 native repo `.md` files convert with no format issue since they are already Markdown; they include a Mermaid diagram (`docs/ARCHITECTURE.md`) that would need a Mermaid-capable renderer to display correctly rather than degrading to a plain code block.

🔵 The 8 Drive `.docx` guides converted cleanly via Pandoc with **zero conversion errors** on all 8 files, producing Markdown plus extracted media folders. The one imperfection found: converted image references carry Word-native inch-based sizing (e.g. `{width="6.5in" height="6.28in"}`), which are print-pagination artifacts meaningless in a web/Markdown rendering context and would need to be stripped or translated during any real ingestion — a fixable but real conversion imperfection.

🔵 `docs/bcrp_qa_testing_checklist.csv` (72 rows) can be represented as a Markdown table, but it is explicitly a **living, editable record** — its "Tested By" and "Date Tested" columns were largely blank on inspection, meaning testers are expected to fill it in over time as a spreadsheet, not read it as static prose. 🟢 **Recommendation:** keep the CSV/spreadsheet as the working artifact and, if needed, mirror a point-in-time snapshot into Markdown rather than treating a static Markdown table as canonical.

🔵 The 6 vendor-source-backup XML files are large generated game-engine metadata (one diffed pair spans 13,000+ lines) — not prose in any sense. Markdown is not an appropriate canonical format for these; they should remain linked attachments.

🔵 The vendor patch file (`docs/vendor-patches/npwd-3.15.1-beta.2-player-unload.patch`) is a unified diff consumed by git/patch tooling. Wrapping it in a Markdown code fence is possible but adds no value over keeping it as a plain attachment.

❓ Whether `docs/reflective-codewalker-commands-2026-07-31.txt` should be Markdown-converted at all is secondary to the more basic Open Question raised in Section 5 — whether it belongs in the knowledge system in the first place.

🟢 **Overall verdict:** Markdown remains a reasonable hypothesis for the prose-heavy majority of the corpus (27 of 36 non-binary files, ~75%, between the 19 native `.md` files and the 8 cleanly-converted `.docx` guides), but the corpus already contains meaningful non-prose material — structured spreadsheet data, generated game-engine XML, a raw diff, and a raw session log — that should not be forced into Markdown. A "Markdown-first, attachment-aware" model fits the evidence better than a "Markdown-everything" model.

**Compliance note:** all format conversions performed for this evaluation were done in a scratch analysis directory only; the original `Documentation.zip` and its extracted source files were left unmodified throughout.

---

## Section 7 — Evaluating Access-Block Syntax Against Real Documents

Only the fragment `:::access scope="moderator"` was provided before the assignment text was cut off; this section evaluates that fragment against concrete corpus documents without fabricating additional syntax requirements beyond what was given.

🔴 **Risk — axis conflation.** The fragment's `scope` value naming (e.g. `"moderator"`) risks colliding conceptually with the corpus's existing in-game ACE permission strings (`mod`, `admin`, `group.admin`, `dev` — found in `docs/COMMANDS_AND_KEYBINDS.md`). These are two different axes: who can *run* a command in-game vs. who can *read* documentation about it. A Moderator using the knowledge base would plausibly still want to read about Admin-tier commands to understand what admins can do — access-block scope values must not be silently wired to, or even just confusingly named after, the pre-existing ACE group strings.

🔵 **Works cleanly at heading granularity in at least one real document.** Applying the fragment to `Building Manager Guide BCRP.docx` is straightforward: the existing `# Developer Console` and `# Completion Summary` headings could each be wrapped in a `:::access scope="developer"` block, leaving the general "Creating an Office" content at default/public visibility — because (per Section 5) this document's audience shift already aligns with its heading structure.

🔴 **Risk — doesn't reach sub-heading/row-level distinctions found in the corpus.** `docs/COMMANDS_AND_KEYBINDS.md` makes audience distinctions at the level of individual **table rows** (a "Staff group" vs. "Admin group" annotation per command row), not whole headings or paragraphs. The block-level `:::access scope="..."` fragment, as shown, doesn't obviously support per-row scoping inside a Markdown table without an awkward workaround (wrapping single rows individually would break table rendering). Real corpus evidence suggests finer-grained tagging may eventually be needed than whole-block wrapping — this is a genuine risk raised by an actual document, not a hypothetical one.

🟡 **Doesn't address duplication.** Applying access blocks to the Fire/Police or Mechanic/Towing duplicate passages (Section 1.6) does nothing to solve their duplication — access-block syntax controls *visibility*, not *content reuse*. This isn't a defect in the syntax itself, just evidence that it solves one problem (who can read what) and not a second, separate one (the same passage existing in two files) that the corpus also has.

❓ **Open Question:** only the `scope="moderator"` fragment was visible before truncation. Whether the intended syntax supports nested/multiple simultaneous scopes, a default-visibility fallback, or scope inheritance across a document could not be evaluated, since that part of the assignment was not received. No additional requirements are assumed here beyond the confirmed fragment.

🟢 **Recommendation:** given Section 5's finding that "moderator" has zero corpus footprint today, any `scope="moderator"` blocks introduced now would have no real content to wrap — the syntax itself may be sound, but there is nothing in the current corpus to validate it against for that specific scope value. The strongest present-day test cases are Developer-scoped (`Building Manager Guide BCRP.docx`, `BCRP_PHOTO_DEPLOYMENT.md`) and Administrator-adjacent content, not Moderator-scoped content.

---

## Summary of corrected findings vs. Phase 0

- The Phase 0 "Moderator-general/Moderator-sensitive" split recommendation is **not supported by the real corpus** — "moderator" occurs zero times across all 36 corpus documents. The simpler corrected hierarchy (Public → Moderator → Developer → Administrator, Administrator broadest) should be retained without an additional Moderator-sensitive carve-out unless future content changes this.
- The corpus's real permission vocabulary (Player / Staff-`mod` ACE / Admin-`admin` ACE / Developer-`dev` ACE) is an in-game runtime-permission system, distinct from and not to be conflated with the knowledge-base documentation-visibility hierarchy under design.
- The team is a solo developer (Deb, human project lead) working with AI collaborators (ChatGPT for architecture, Cody/Codex for implementation/review) per `docs/development-workflow.md` — relevant context for why no human "Moderator" role concept exists anywhere in the dev-process documentation.
- The "one canonical subject, multiple views" hypothesis found one strong supporting case (bcrp-hud cluster, though the correct granularity is multiple document types for one audience, not audience-gated sections) and one strong falsifying case (vehicle impound, which is really two different subjects sharing a noun), plus a third pattern (commands/controls) that is version-precedence-driven rather than audience-driven — not every same-noun multi-file case fits the hypothesis, and the corpus's actual duplication problem is mostly cross-sibling boilerplate copying rather than same-subject view-splitting.
