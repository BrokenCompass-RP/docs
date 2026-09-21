---
title: BCRP HUD engineering backlog
description: ''
default_visibility: developer
---
# BCRP HUD engineering backlog

Stable backlog for the BCRP-owned fork of Qbox `qbx_hud`. A `Complete`
Phase 1 item means its static acceptance criteria passed; it does not imply
in-game validation. Runtime parity items remain `Validation Required`.
Phase 2B implementation, static checks, and its approved runtime test pass are
complete. The broader cross-resource visibility matrix remains tracked under
HUD-057 for final integration validation.
Phase 2C implementation and static checks are complete, and runtime validation
confirmed Phase 2B visual parity with no normal-gameplay regressions observed.

## Phase 1 — Safe Fork

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-001 | Resource | Fork `qbx_hud` to `bcrp-hud` | Critical | Complete | 1 | `[qbx]/qbx_hud`, `[bcrp]/bcrp-hud` | Git worktree | Fork contains the same 52 baseline files and upstream remains byte-unchanged | Identity files intentionally differ in fork |
| HUD-002 | Resource | Rename resource metadata safely | Critical | Complete | 1 | `fxmanifest.lua`, `README.md` | HUD-001 | Folder is `bcrp-hud`, manifest name is `BCRP HUD`, upstream attribution and baseline are recorded | Version is `0.1.0-bcrp.1` |
| HUD-003 | Compatibility | Verify internal resource-name references | Critical | Complete | 1 | Entire fork | HUD-001 | Every `qbx_hud` occurrence is classified as upstream metadata or a preserved public event; NUI URLs use `GetParentResourceName()` | No global replacement |
| HUD-004 | Configuration | Preserve KVP behavior | High | Complete | 1 | `client/main.lua` | FiveM resource KVP | Key remains `hudSettings`; settings code is unchanged | Resource-scoped KVP means fork starts with its own namespace |
| HUD-005 | Compatibility | Preserve NUI callbacks and actions | Critical | Complete | 1 | `client/main.lua`, `html/app.js` | FiveM NUI | Callback names and current NUI actions match upstream exactly | Runtime parity still required |
| HUD-006 | Minimap | Preserve streamed minimap assets | Critical | Complete | 1 | `stream/*`, `client/main.lua` | FiveM streaming | All four streamed files exist and square/circle texture names remain unchanged | In-game mask validation required |
| HUD-007 | Configuration | Preserve locale loading | High | Validation Required | 1 | `locales/*`, `fxmanifest.lua` | ox_lib locale | All 19 locale files parse and the configured locale resolves every runtime key | Files/mount are preserved, but inherited upstream `cs.json` is invalid JSON and needs a separate Phase 2 correction |
| HUD-008 | Resource | Preserve Qbox and Ox dependencies | Critical | Complete | 1 | `fxmanifest.lua`, `server.cfg` | `ox_lib`, `qbx_core`, ox resources | Manifest includes resolve and providers start before fork | Static order verified |
| HUD-009 | Vehicle | Preserve seatbelt/harness behavior | Critical | Complete | 1 | `client/main.lua`, `qbx_seatbelt` | restored `qbx_seatbelt` | Fork still reads `LocalPlayer.state.seatbelt` and `.harness`; public compatibility event remains | Runtime state transitions required |
| HUD-010 | Vehicle | Confirm restored `qbx_seatbelt` ownership/API | Critical | Complete | 1 | `[qbx]/qbx_seatbelt` | qbx_core, ox_inventory | Manifest, state writes, events, export, harness handling, and UI behavior are documented | No seatbelt edit required |
| HUD-011 | Configuration | Prevent simultaneous upstream/fork startup | Critical | Complete | 1 | `server.cfg` | `[qbx]`, `[bcrp]` group starts | `qbx_hud` is stopped after `[qbx]`; `[voice]` and providers precede `[bcrp]` | Test-branch reversible change |
| HUD-012 | Testing | Static Phase 1 validation | Critical | Complete | 1 | Fork, upstream, config | Lua/Node/git tools | File references, Lua/JS syntax, identity references, upstream integrity, and start order pass; inherited validation exceptions are recorded | `cs.json` defect is recorded under HUD-007; does not claim FiveM runtime validation |
| HUD-013 | Testing | Controlled in-game parity validation | Critical | Validation Required | 1 | Test server/client | HUD-001–012 | Every item in `bcrp-hud-phase-1-validation.md` is checked with no critical regression | Required before Phase 2 |
| HUD-014 | Documentation | Maintain fork code/resource map | High | Complete | 1 | `docs/bcrp-hud-resource-map.md` | HUD-001 | Tree, responsibilities, ranges, APIs, data flow, and risks reflect fork baseline | Update when line ranges change |

## Phase 2 — Technical Cleanup

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-015 | Lua Client | Correct pause boolean handling | High | Complete | 2B | `client/main.lua`, `html/app.js` | Phase 1 parity | Pause hides intended HUD components using boolean payloads and restores them without altering manual state | Boolean payload is now consumed as a boolean and participates in reason-based visibility |
| HUD-016 | Visibility | Correct incomplete hide/show behavior | High | Complete | 2B | client/server visibility events | Phase 1 parity | Existing hide/show events control player, vehicle, compass, and radar consistently inside/outside vehicles | Public `qbx_hud:client:*Hud` event names are preserved; runtime matrix remains required |
| HUD-017 | Frontend | Remove dead `showconstant` action | Low | Complete | 2A | `html/app.js` | Compatibility search | Repository-wide search finds no sender; action case and sole method are absent; active action set is unchanged | Removed after source/template inspection |
| HUD-018 | Compatibility | Resolve dead/legacy events | Medium | Planned | 2 | `client/main.lua`, repository producers | Runtime telemetry/search | Each legacy event is retained with owner, migrated, or removed after zero-producer evidence | Includes air HUD, harness, nitrous |
| HUD-019 | Vehicle | Repair seatbelt/altitude display toggles | Medium | Complete | 2B | `client/main.lua` | qbx_seatbelt | Toggles survive update cycles and vehicle transitions | User toggle state is no longer overwritten; aircraft display overrides are derived without mutating it; runtime persistence validated |
| HUD-020 | Performance | Remove duplicate speed calculation | Medium | Complete | 2C | `client/main.lua` | Data contract tests | Speed native is read once per update cycle and both consumers receive identical value | Existing rounded speed payload is cached; no cadence or unit change |
| HUD-021 | Performance | Remove duplicate fuel polling | Medium | Deferred | 2C / Later | `client/main.lua`, ox_fuel adapter | ox_fuel | One cached fuel input serves display and low-fuel alert without extra native polling | Existing two-second shared cache already prevents most duplicate fuel natives; further consolidation risks stale fuel on rapid vehicle transitions |
| HUD-022 | Performance | Suspend inactive cinematic loop | Medium | Partial | 2C / Later | `client/main.lua` | Cinematic decision | No every-frame cinematic work occurs when bars are disabled | Phase 2C removes redundant cinematic NUI hides; changing the frame-loop wait requires measurement because polling cadence is frozen |
| HUD-023 | Performance | Bound compass polling frequency | Medium | Partial | 2C / Later | `client/main.lua` | Compass decision | Heading updates meet chosen visual latency without permanent `Wait(0)` mode | Phase 2C will skip heading natives while hidden and deduplicate baseplate visibility sends; interval changes require profiling |
| HUD-024 | Performance | Stop stress threads when stress disabled | High | Deferred | 2C / Later | client/server stress sections | shared stress config | No shooting/effect threads run when `enableStress=false`; enabled behavior remains equivalent | Deferred because gating existing handlers/effects changes configuration behavior and needs dedicated runtime validation |
| HUD-067 | Performance | Cache repeated main-loop native/state reads | Medium | Complete | 2C | `client/main.lua` | HUD-020 | Health, armor, water state, parachute, speed, vehicle eligibility, and shared state values are read once per update and reused | Payload values and ordering are unchanged; aircraft-only checks no longer run on foot |
| HUD-068 | Performance | Remove redundant hidden-state NUI traffic | Medium | Complete | 2C | `client/main.lua` | Phase 2B visibility model | Logged-out and stacked hide reasons emit only transition messages; cinematic mode does not resend hidden actions every frame | Visibility restoration is forced through existing diff/state handling |
| HUD-069 | Performance | Deduplicate on-foot baseplate visibility messages | Medium | Complete | 2C | `client/main.lua` | HUD-023 | Unchanged on-foot baseplate visibility is not resent for every heading change | Heading messages remain unchanged when visible; baseplate sends occur on visibility transitions |
| HUD-025 | Frontend | Remove frontend fuel `* 0.71` distortion | High | Planned | 2 | `html/app.js` | Fuel parity baseline | A native/state value of 0/50/100 renders as 0/50/100 | Visual arc may transform separately |
| HUD-064 | Frontend | Remove unused frontend bookkeeping | Low | Complete | 2A | `html/app.js`, `html/index.html` | Repository/template inspection | Unused `selection`, third progress slot, `targetId` writes and now-unused event parameters, `formatMoney`, `Config`, commented handler, and compass `type` write are absent; active listeners/callbacks and rendered markup are unchanged | No UI redesign |
| HUD-065 | Lua Server | Remove unreachable stress reset branches | Low | Complete | 2A | `server/main.lua` | Repository inspection, Lua syntax | Private `resetStress` constant and unreachable branches are absent; both public stress events retain identical false-branch calculations and notifications | Stress behavior/config unchanged |

## Phase 3 — Data Contract

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-026 | Data | Define versioned normalized HUD payload | Critical | Complete | 3 | Lua/NUI contract | Phase 2 | Types, units, ranges, optionality, cadence, and ownership are documented and contract-tested | `contractVersion=1` fields extend legacy `hudtick`/`car`; see `bcrp-hud-data-contract.md` |
| HUD-027 | Vehicle | Add RPM | High | Complete | 3 | vehicle data collector | GTA native | Normalized RPM is present only for supported active vehicles and clamps safely | `rpm` is clamped `0..1` and rounded to three decimals |
| HUD-028 | Vehicle | Add gear | High | Partial | 3 | vehicle data collector | GTA native | Forward, neutral, reverse, and unsupported cases render deterministically | Raw `gear` and honest `reverse_or_neutral` ambiguity are exposed; exact stopped reverse/neutral distinction remains deferred |
| HUD-029 | Vehicle | Add body health if selected | Low | Deferred | 3 | vehicle data collector | Design decision | If approved, normalized body health is contract-defined and warning-tested; otherwise item is rejected | Avoid unused polling |
| HUD-030 | Vehicle | Add vehicle class/type | Medium | Complete | 3 | vehicle lifecycle | GTA natives | Class/model policy is evaluated on vehicle change and sent without per-frame re-read | Cached `vehicleClass`, normalized `vehicleType`, and `isAircraft` drive future cluster eligibility |
| HUD-031 | Voice | Add true radio transmit state | High | Complete | 3 | pma-voice adapter | `radioActive` state/event | Radio indicator activates only while transmitting, not merely while on a channel | Normalized `radioTransmitting` is separate from `voiceTalking` and `radioChannel` |
| HUD-032 | Vehicle | Add absolute cruise state | High | Deferred | 3 / Provider | qbx_cruise integration | qbx_smallresources | HUD receives an idempotent boolean and recovers correctly on restart/vehicle exit | Installed cruise resource exposes only a toggle event and may not be modified in Phase 3 |
| HUD-033 | Vehicle | Normalize seatbelt/harness inputs | High | Complete | 3 | qbx_seatbelt adapter | HUD-010 | Boolean state and harness durability semantics are documented and restart-safe | `seatbeltActive` and `harnessActive` normalize nil to false without moving mechanics |
| HUD-034 | Compatibility | Review legacy `hud:client:*` contract | High | Complete | 3 | repository-wide producers | HUD-026 | Every legacy event has a tested compatibility decision and deprecation path | All interfaces retained; toggle-derived cruise and unresolved nitro remain explicitly legacy |
| HUD-035 | Data | Validate nitrous ownership | Medium | Validation Required | 3 | entity `nitro`, `nitroFlames`; legacy event | runtime resources | Canonical writer, units, and lifecycle are identified or nitrous is explicitly excluded | Do not guess |

## Phase 4 — BCRP Frontend

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-036 | Frontend | Replace external CDN dependencies | High | Planned | 4 | frontend assets/tooling | Approved licenses | HUD loads with outbound network unavailable and dependencies are version locked | Includes Vue/Quasar/jQuery/fonts/icons decision |
| HUD-037 | Frontend | Add reproducible dependency locking/build | High | Planned | 4 | package/build files | HUD-036 | Clean checkout builds identical deployable output with documented command | Source/output separation required |
| HUD-038 | UI | Use local fonts/icons or approved replacements | Medium | Planned | 4 | frontend assets | Brand/licensing approval | Every icon/font renders offline and license/source is documented | Avoid Font Awesome Pro CDN dependency |
| HUD-039 | Minimap | Implement framed minimap | High | Planned | 4 | HTML/CSS, streamed minimap | Data/minimap parity | Frame aligns across supported aspect ratios and both mask modes without clipping | Native minimap remains native |
| HUD-040 | UI | Implement thin icon row | High | Planned | 4 | frontend | HUD-026 | Approved statuses occupy deterministic slots and meet readability/accessibility criteria | Persistent ambient UI only |
| HUD-041 | Vehicle | Implement vehicle gauge cluster | Critical | Planned | 4 | frontend, vehicle contract | HUD-027–033 | RPM/fuel arcs, speed, gear, warnings, and transitions match approved design | No vehicle mechanics |
| HUD-042 | Vehicle | Fix seatbelt/cruise indicator slots | High | Planned | 4 | vehicle UI | HUD-032–033 | Seatbelt remains in fixed right slot and cruise remains beside it without layout shift | Test all boolean combinations |
| HUD-043 | Voice | Implement voice/radio indicators | High | Planned | 4 | status row | HUD-031 | Speaking, transmitting, range, and channel states are visually distinct and accurate | pma UI can then be disabled |
| HUD-044 | UI | Replace responsive layout | High | Planned | 4 | HTML/CSS | Approved resolution matrix | Layout passes supported aspect ratios without resolution-specific duplication | Replace legacy override sheet |

## Phase 5 — Integration and Migration

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-045 | Visibility | Add reason-based visibility | Critical | Partial | 2B / 5 | client API/state | Phase 3 contract | Concurrent reasons cannot unhide one another; restart/close paths clear owned reasons | Phase 2B adds the minimum internal model for `manual`, `inventory`, `pause`, `cinematic`, and `loggedOut`; a public reason API and external owner integration remain Phase 5 |
| HUD-046 | Visibility | Add `/hideui` | High | Complete | 2B | client command | HUD-045 | Command adds manual reason and hides all intended HUD/minimap elements | Does not affect gameplay UI |
| HUD-047 | Visibility | Add `/showui` | High | Complete | 2B | client command | HUD-045 | Command removes only manual reason and respects remaining system reasons | Idempotent |
| HUD-048 | Visibility | Persist manual visibility in KVP | High | Complete | 2B | client KVP | HUD-045–047 | Manual choice survives resource/client restart; transient reasons do not persist | Uses separate `bcrpHudManualHidden`; existing `hudSettings` key and payload are unchanged |
| HUD-049 | Configuration | Define native HUD component policy | High | Planned | 5 | qbx_hudcomponents/config, BCRP HUD | UI validation | Each GTA HUD component has one documented owner and no conflicting suppression | Prefer configuration |
| HUD-050 | Compatibility | Decide account popup | Medium | Validation Required | 5 | money events/frontend | Product decision | Keep, replace, or retire is documented; legacy producers have a compatibility outcome | Banking UI remains external |
| HUD-051 | UI | Decide compass/street names | Medium | Validation Required | 5 | compass/baseplate | Product decision | Retention and placement are approved and implemented/tested | Avoid unused polling |
| HUD-052 | UI | Decide cinematic mode | Low | Validation Required | 5 | native bars/visibility | Product decision | Keep/replace/retire choice is documented and behavior tested | Avoid background loop if retired |
| HUD-053 | Compatibility | Validate player-count overlay | Medium | Validation Required | 5 | `bcrp-playercount` | in-game review | Collision, persistence, and ownership are documented; adaptation decision approved | Separate resource |
| HUD-054 | Compatibility | Validate `srp-rptools` overlay | Medium | Validation Required | 5 | `srp-rptools` fire-vest UI | role testing | Overlay collision and required persistence are documented | Separate resource |

## Phase 6 — Validation and Retirement

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-055 | Testing | Vehicle-class test matrix | Critical | Planned | 6 | all supported vehicles | Phase 4/5 | Driver/passenger and class-specific results are recorded for road, bike, boat, aircraft, emergency, train, CVT/electric cases | Include exit/re-entry |
| HUD-056 | Testing | Aspect-ratio and safe-zone tests | Critical | Planned | 6 | minimap/frontend | HUD-039, HUD-044 | Approved resolutions and safe-zone extremes pass without overlap/clipping | Screenshot evidence |
| HUD-057 | Testing | Visibility transition matrix | Critical | Planned | 6 | spawn, appearance, death, pause, cameras | HUD-045 | Every transition restores correct HUD/radar state with stacked reasons | Include failure/restart paths |
| HUD-058 | Performance | Profiler comparison | High | Planned | 6 | resmon/profiler | completed feature set | Idle/on-foot/driving cost is no worse than approved baseline and no duplicate loops remain | Record hardware/client conditions |
| HUD-059 | Resource | Retire upstream `qbx_hud` | Critical | Planned | 6 | `server.cfg`, upstream resource | all validation | Production starts only `bcrp-hud`; rollback instructions restore upstream without data loss | Do not delete vendor source |
| HUD-060 | Documentation | Publish migration/runbook | High | Planned | 6 | docs/config | HUD-059 | Start order, rollback, settings/KVP behavior, known compatibility, and validation evidence are documented | Operations handoff |

## Deferred / Optional Features

| ID | Area | Issue / Feature | Priority | Status | Phase | Files / Systems | Dependencies | Acceptance Criteria | Notes |
|---|---|---|---|---|---|---|---|---|---|
| HUD-061 | UI | Optional nitrous indicator | Low | Deferred | Optional | frontend/data adapter | HUD-035, product approval | Implemented only with canonical owner and approved persistent display | Otherwise reject |
| HUD-062 | UI | Optional persistent vehicle repair warning | Low | Deferred | Optional | engine/body data | product approval | Warning threshold, owner, and supported vehicle classes are documented/tested | Avoid duplicating mechanic UI |
| HUD-063 | Configuration | Optional circular minimap mode | Low | Deferred | Optional | minimap assets/settings | design approval | Mode remains selectable and passes full minimap test matrix | May be rejected for one BCRP style |
| HUD-066 | Vehicle UI | Adaptive aircraft cluster | High | Documented / Deferred | Phase 4 | future aircraft cluster frontend | HUD-027–030, HUD-041 | Aircraft uses altitude with explicit unit as center metric while speed remains simultaneously available in a secondary position | Phase 3 provides speed, feet altitude, normalized vehicle type, and aircraft boolean; visual implementation remains deferred |
| HUD-070 | Vehicle | Normalize speed, altitude, engine, and fuel values | High | Complete | 3 | `client/main.lua`, data contract | HUD-026 | Explicit units/defaults accompany stable normalized values while legacy fields remain unchanged | Adds `speedValue/speedUnit`, `altitudeValue/altitudeUnit`, `engineHealthPercent`, and `fuelPercent` |
