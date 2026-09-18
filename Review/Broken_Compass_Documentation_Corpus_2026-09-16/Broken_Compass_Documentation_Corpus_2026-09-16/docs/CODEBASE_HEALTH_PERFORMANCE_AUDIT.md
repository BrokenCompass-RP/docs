# Broken Compass RP — server codebase health/performance audit

## Current engineering snapshot — 2026-09-09

This section supersedes the older 2026-07-20 conclusions retained below as historical context. It began as a static, repository-wide status and performance review, not a live profiler capture. A focused low-risk optimization pass completed later on 2026-09-09 is recorded below. Runtime impact estimates should still be validated with FiveM `resmon`, hitch warnings, network telemetry, and oxmysql slow-query data before larger optimization.

### Status and readiness

| Item | Current state |
|---|---|
| Branch / revision | `Ezi-BCRP-Dev` at `56e3e727d` (`Merge branch 'BCRP-Test' into Ezi-BCRP-Dev`), matching `origin/Ezi-BCRP-Dev` at review start |
| Working tree at review start | Clean: 11,357 tracked files; 0 staged, 0 unstaged, 0 untracked |
| Resource structure | 233 modern `fxmanifest.lua` resources and 22 legacy manifest-backed resources. Major groups: `[bcrp]` 24, `[qbx]` 40, `[standalone]` 52, `[cfx-default]` 24, `[entitlements]` 11, `[vehicles]` 11, `[ox]` 7, plus maps, streams, phone, voice, SRP, TFC, and shell resources. |
| Automated coverage discovered | 15 `bcrp-firehose` Lua contracts, 9 `bcrp-fires` Lua contracts, 3 `bcrp-propertytools` Lua contracts plus fixtures, 1 `qbx_garages` Lua contract, 6 property/building PowerShell contracts, and one example TypeScript test. Coverage is concentrated in newer BCRP systems rather than repository-wide. |
| Validation tooling | Lua parse validation is available through `tools/validate-lua.ps1`; the installed compiler is Lua 5.5, so the script warns that it does not exactly match FiveM Lua 5.4. Most resource tests are standalone Lua scripts rather than a single CI runner. No repository-wide lint/build/test pipeline was found. |
| Current stability | **Development-ready, not performance-certified.** Core hose/fire behavior has meaningful contract coverage and the nozzle origin is visually validated. The largest remaining uncertainty is live frame/network cost with multiple long hoses and streams. |

Recent relevant work is concentrated in firehose/fire-system files. Since 2026-08-01, the most frequently changed files include `bcrp-firehose/config/shared.lua` (22 commits), `client/attackline.lua` (14), its manifest (13), `server/main.lua` (12), `client/main.lua` (10), and `bcrp-fires` configuration/registry files. The 2026-09-09 commit `516800acf` moved the water point to the nozzle. This concentration raises regression risk even though the current tree is clean.

**CONFIRMED — what works now**

- The firehose resource has server-authoritative attack/supply sessions, apparatus and hydrant integration, replicated visual presentation, water capacity/state handling, targeting, suppression integration, cleanup handlers, and focused Lua contracts.
- The earlier `qbx_properties` correctness defect is fixed: `startRentThread(propertyId)` now receives the property ID at `server/property.lua:455`. The one-coroutine-per-rental architecture remains.
- The earlier clothing-bag timeout/authority defects are fixed in `bcrp-rptools`: timeout units are seconds and inventory restoration uses server-side `ox_inventory:AddItem` with owner and distance validation.
- The former HUD cinematic NUI-per-frame defect is gone in the active `bcrp-hud`; the frame loop now draws frame-scoped rectangles/radar state only.
- Firehose/fires master debug visualization switches are off, so their debug marker/line loops do not render during normal play.

**KNOWN RISK**

- Supply-hose presentation rebuilds terrain-adjusted paths and tube geometry every rendered frame while visible.
- Attack-hose presentation still performs substantial per-frame procedural and draw work for every active replicated context.
- Water impact resolution can maintain two shape-test pipelines for each active local or nearby replicated stream.
- The active 10 ms police flashlight scan and ambient-radio vehicle-pool scan remain production costs requiring gameplay/profile evidence before cadence changes.
- Weed maintenance uses duplicated full-table workers and row-by-row writes.

**POSSIBLE ISSUE**

- `server.cfg` ensures `[stream]` twice. FiveM normally treats a second ensure of an already-started resource group as harmless, but startup logs should confirm there is no unintended restart/work.
- `local-resources.cfg` re-ensures phone-app and vehicle groups already covered by `server.cfg`. This may be deliberate local override behavior; verify startup ordering before consolidating.
- `Config.Hose.visuals.debugMapOnlyComparison = true` has a debug-sounding name but no direct reader was found. The collision resolver currently performs both LOS and capsule tests regardless, so changing this flag alone should not be assumed to alter cost.

**TECHNICAL DEBT**

- Several active firehose options retain investigation names (`nativeUnwindTest`, `leaderTest`, `sling_calibration.lua`) even though they now participate in production behavior.
- The firehose attack context uses multiple cooperating threads per replicated session. Idle waits are generally adaptive, but active-session cost scales with session count and is harder to reason about than a consolidated scheduler.
- `bcrp-fires` runs the native world-reactivity proof path in production (`devProofMode = true`, native adoption enabled, vegetation profile described as a live experiment). It is bounded and intentional, but it is not the final ownership/failover architecture.
- Test coverage is strong for the recent hose/fire work but sparse for many legacy/vendor-derived resources.

**DEFERRED**

- Do not alter stream direction, trajectory, particles, aiming, IK, animations, attachment, hose physics, or collision cadence as part of nozzle calibration.
- Do not consolidate active hose schedulers or replace presentation geometry without an isolated profiler-backed gameplay experiment.
- Do not remove diagnostic utilities merely because their filenames contain `test`, `debug`, or `calibration`.

### Runtime switches and debug/experimental state

| System | State | Classification / consequence |
|---|---|---|
| Firehose `Config.Debug.enabled` and category flags | Disabled | No ordinary firehose debug markers, lines, verbose diagnostics, endpoint geometry, or lifecycle overlays. |
| Nozzle calibration utility | Preserved, hard-disabled by `DEBUG_UTILITY_ENABLED = false` before commands/threads register | `/nozzle`, `/noz x|y|z`, `/noz print`, cyan sphere, and origin line are inactive. |
| Other firehose diagnostics | Preserved, disabled | Hydrant, apparatus/truck, hose connection, rope test, pose camera, origin/stream geometry, endpoint/terminal geometry, water, targeting, impact, and lifecycle diagnostics remain available for development. |
| Fires `Config.Debug.enabled` | Disabled | Category flags cannot activate normal debug drawing without the master gate. |
| Fires test mode | `debugFireMode = false` | Admin test commands use authored production coordinates; `disableAutomaticIncidents = true` does **not** disable automatic incidents unless debug-fire mode is also enabled. |
| Fires native world reactivity | Enabled | `devProofMode`, native adoption, and the vegetation live experiment participate in production behavior. Treat as active experimental architecture, not dead debug code. |
| `nativeUnwindTest` | Enabled | Active attack-line rope/unwind behavior despite its name. |
| `leaderTest` | Enabled | Active logical leader/path payout and presentation behavior despite its name. |
| `/hosesling` / `sling_calibration.lua` | Enabled | Active sling attachment/semantic endpoint behavior; only its coupling marker is disabled. |
| `legacyRopePresentation` / `segmentTest` | Disabled | Retained alternate/test paths, not current production presentation. |
| `ox_target:debug` in `local-resources.cfg` | **Enabled** | Ox target debug support is active in the local include. Review whether this is appropriate for the deployment environment; it was not changed during this documentation-only pass. |

### Firehose nozzle-origin investigation — completed

- Production weapon: `WEAPON_FIREHOSE`; drawable: `w_mg_firehose`.
- Attachment hierarchy: GTA weapon attachment/weapon IK, not a custom prop attached directly to a ped bone by this resource.
- Model inspection found `Gun_Root`, `Gun_Main_Bone`, `Gun_GripL`, and `Gun_GripR`. There is no `gun_muzzle` bone.
- Because no usable muzzle bone exists, the production origin resolver falls back to weapon-entity local space and applies `weaponOffset + originAdjustment`.
- Previous fallback origin: `vector3(0.000, 0.060, 0.000)`.
- Current calibrated origin: `vector3(0.291, 0.033, 0.042)` in `bcrp-firehose/config/shared.lua:21`.
- The current origin was visually validated in-game and produced a substantially better nozzle opening alignment. Only the local origin changed; direction, trajectory, water physics, particles, aiming, IK, animations, hose behavior, and attachment architecture did not.

### Low-risk optimization pass — completed 2026-09-09

- **Resolved:** attack-line `nozzleWorldAxes`, `nozzleCouplingAxes`, their nine world-offset native calls, and the duplicate debug-only raw-tail lookup now run only when the existing master debug switch and `nozzleTerminalGeometry` category are enabled. Production endpoint, coupling, tangent, ground terminal, attachment, and water transforms remain unconditional.
- **Resolved:** the firehose water HUD retains its 100 ms state-check cadence but shallow-compares the complete NUI payload plus controlled session identity. Initial state, changes, session transitions, hide, and reacquisition still publish; unchanged payloads do not.
- **Reduced:** police evidence pickup rendering now sleeps 250 ms while unauthorized or without a valid selected item, and runs per-frame only for an on-duty LEO with actionable evidence. Pickup and the three active flashlight scans reuse one ped-coordinate lookup per iteration. Shooting detection remains a separate `Wait(0)` loop and active flashlight discovery remains at 10 ms.
- **Resolved:** cinematic bars no longer have a permanently polling frame thread. `cinematicShow` starts a guarded drawing thread when width becomes positive; it stays per-frame while visible and exits when width reaches zero.
- **Reviewed, unchanged:** ambient radio uses configurable `Config.ScanIntervalMs = 3000` and enumerates the complete streamed `CVehicle` pool each scan. A later reversible experiment can compare 3 seconds with 10 seconds while measuring discovery delay and `resmon`.

### Ranked performance findings

The priority is based on static evidence and likely scale. `Now` means measure or make a small isolated experiment next, not silently ship a change.

| Rank | File / function | Current behavior and cost trigger | Severity / confidence | Suggested adjustment | Change risk / type | Priority |
|---:|---|---|---|---|---|---|
| 1 | `bcrp-firehose/client/supplyline.lua:838-895`, presentation loop / `drawTube` | For every visible supply session, every frame copies/relaxes the route, performs terrain subdivision/probes, resamples it, rebuilds tube/coupling rings, and issues `DrawPoly` calls. Cost grows with line length and visible session count; a 200 m line at 0.45 m spacing and 10 radial segments implies thousands of triangles per frame. | High / Confirmed | Cache terrain-resolved, resampled, and ring geometry by path revision; update only the moving terminal span while carried. Preserve per-frame drawing. | Requires gameplay testing | Now |
| 2 | `bcrp-firehose/client/attackline.lua:5082-5106`, `drawMutableHosePath`, `drawHoseCouplings` | Main rings are cached, but every active replicated hose draws every frame; coupling distances/rings and procedural nozzle-terminal samples/rings are rebuilt in the draw path. Cost grows with active contexts and hose length. | High / Confirmed | Cache coupling and terminal geometry by render generation and nozzle-transform threshold; keep draw natives per frame. | Requires gameplay testing | Now |
| 3 | `bcrp-firehose/client/presentation.lua:107-205,603-630`, collision/remote presentation | Each live stream can continuously complete and restart both capsule and LOS shape tests. Remote presentation becomes frame-rate when any non-stale stream exists and resolves players, peds, weapon transforms, interpolation, particles, and collision for each nearby stream. | High / Confirmed | Profile 1/2/4 simultaneous streams; experiment with collision sampling at 30 Hz while retaining per-frame particle transforms and interpolation. | Requires gameplay testing; correctness-sensitive | Now |
| 4 | `[bcrp]/qbx_police/client/evidence.lua:247-335`, evidence loops | **Reduced:** pickup rendering now sleeps while unauthorized/idle and coordinate lookups are reused. The authorized flashlight scan still examines three evidence maps every 10 ms while active. | Moderate / Confirmed | Profile only the remaining active flashlight scan; test 100 ms or a spatial index separately if evidence supports it. | Requires gameplay testing | Monitor / Later |
| 5 | `bcrp-firehose/client/attackline.lua:4915-5005`, nozzle endpoint transform | **Resolved for debug preparation:** nine debug-axis transforms are now master/category-gated. Required production endpoint, tangent, terminal, and coupling calculations remain active. | Low / Confirmed | No further change in this low-risk pass. Profile remaining production transforms with multiple attack contexts. | Requires gameplay testing | Monitor only |
| 6 | `[bcrp]/bcrp-ambient-radio/client/main.lua:144-163,199-238` | Every client enumerates its entire streamed vehicle pool every 3 seconds and groups eligible models; each active sound also owns a 500 ms lifecycle coroutine. | Moderate / Confirmed | First test a 10-second scan interval or eligibility/distance gate; later consider entity lifecycle/target-driven discovery. | Reversible experiment; gameplay testing | Next patch |
| 7 | `[qbx]/qbx_weed/server/main.lua:212-237` | Two independent workers perform full `player_plants` reads at 1,152 s and 576 s, update rows individually, and broadcast refreshes. Cost occurs on timers and scales with stored plant count. | Moderate / Confirmed | Combine maintenance into one pass/transaction, batch updates, and broadcast only changed state. Measure query counts first. | Architectural; DB/gameplay testing | Later |
| 8 | `bcrp-firehose/client/supplyline.lua:899-925` and `server/supplyline.lua:147-164` | While carried, the owner serializes and sends the complete path at most every 500 ms; the server validates then broadcasts the session. Payload grows to the configured point cap and fans out to clients. | Moderate / Confirmed | Instrument bytes/event and path-point distribution; test revision/delta or quantized payload only if telemetry warrants it. | Architectural; networking/gameplay risk | Monitor / Later |
| 9 | `bcrp-firehose/client/water.lua:15-45,86-94` | **Resolved:** the 100 ms control cadence remains, but unchanged payload/session combinations no longer send to NUI. Hide and reacquisition reset publication state. | Low / Confirmed | No further adjustment pending live HUD smoke testing. | Completed low-risk change | Monitor only |
| 10 | `[qbx]/qbx_properties/server/property.lua:407-431,494-505` | One long-lived coroutine is created per rental; each sleeps for the property interval and queries independently. The correctness argument bug is fixed, but timer/query cardinality grows with rentals. | Moderate / Confirmed | Replace with one indexed due-rent scheduler/batched query after behavior-equivalence tests. | Architectural; economy risk | Later |
| 11 | `[bcrp]/bcrp-hud/client/main.lua:81-115,1194-1198` | **Resolved:** cinematic drawing is started by activation, stays per-frame while width is positive, and exits at zero. Compass behavior is unchanged. | Low / Confirmed | No further adjustment pending live cinematic smoke testing. | Completed low-risk change | Monitor only |
| 12 | `bcrp-fires/client/world_reactivity.lua:20-69` and server propagation | The active native-adoption proof samples eligible settled nodes every 2.5 s (eight configured directions) and can report candidates to server propagation. It is host/eligibility bounded, but cost and ownership behavior need real incident telemetry. | Moderate / Likely | Instrument eligible nodes, samples, candidates, and handler time during vegetation incidents before changing cadence or ownership. | Architectural; gameplay correctness | Monitor only |

Required per-frame work should remain per-frame: `DrawPoly`, `DrawMarker`, `DrawLine`, frame-scoped control disabling, active camera/input handling, and particle/nozzle presentation. The optimization target is repeated preparation, lookups, allocations, or debug-only transforms—not the final frame natives themselves.

### Small reversible experiments

1. **Completed:** gate attack-line debug-only nozzle axes behind `Config.Debug.enabled` plus `nozzleTerminalGeometry`.
2. **Completed:** deduplicate unchanged 100 ms firehose water NUI publications without changing control cadence.
3. **Completed:** add empty/unauthorized pickup sleeps and one-per-iteration ped-coordinate reuse to police evidence.
4. **Experiment remaining:** increase ambient-radio pool scanning from 3 s to 10 s on a test server and measure discovery delay plus `resmon` before/after.
5. **Completed:** replace inactive HUD cinematic frame polling with an activation-started visible loop.
6. **Profiler-dependent:** prototype supply-line presentation caching for a single path revision behind a temporary feature flag; compare visual equivalence and frame time on 50 m and 200 m lines before expanding it.

### Evidence required before larger changes

- Capture client `resmon` for no hose, one attack line, one 200 m supply line, and multiple simultaneous lines; record average and worst frame time.
- Capture active-stream shape-test completion rate and compare current cadence with a 30 Hz collision experiment. Confirm impact point, suppression, and obstruction behavior.
- Measure supply-path payload bytes, point counts, event rate, and recipients during payout/retrace before designing delta replication.
- Capture oxmysql slow queries and `player_plants`/rental cardinality before changing weed or rent schedulers.
- Exercise vegetation fire ownership, adoption, reconnect, host migration, cleanup, and automatic lifecycle before graduating `devProofMode` architecture.

### Recommended next priorities and review trigger

1. Profile supply hose, attack hose, and water collision in controlled multiplayer scenarios.
2. In-game smoke-test the completed low-risk gates: nozzle/stream presentation, water HUD transitions, evidence discovery/pickup, and cinematic activation/closure.
3. Use the profiling results to choose either supply geometry caching or collision cadence as the next substantive optimization—not both in one patch.
4. Decide whether `ox_target:debug 1` belongs in the deployment-specific local include.
5. Plan the fires native-reactivity ownership/failover path before treating the proof implementation as final architecture.

Review again after the first hose profiling session, before increasing player capacity beyond the current 10-client configuration, or after any material hose model/attachment, collision, renderer, or fire-propagation change.

### Validation results

| Check | Result |
|---|---|
| Repository Lua validator | Passed for its four configured roaming/quest-hints targets. It used installed Lua 5.5 and emitted the expected FiveM Lua 5.4 mismatch warning. |
| `bcrp-firehose` Lua contracts | **16/16 passed**, including nozzle-origin/debug gating, water HUD deduplication, collision, session lifecycle, rendering, and manifest initialization. |
| Focused HUD / police contracts | **2/2 passed**: cinematic active-only rendering and evidence idle/auth sleep plus coordinate reuse. |
| `bcrp-fires` Lua contracts | **5/9 passed; 4 failed due to contract drift.** `automatic_lifecycle` expects the old 390,000 ms lifetime while production now has `maximumLifetimeMs = 450000`; `automatic_scheduler` and `vespucci_grass_creation` expect the old `no_nearby_settlement_client` wording while production returns `no_settlement_client`; `dispatch_adapter` expects all debug category defaults false while `Config.Debug.enabled` is false but category switches such as `Dispatch` are true. Review whether production or tests express the intended current contract. |
| `bcrp-propertytools` Lua contracts | **3/3 passed** when run with each script's expected working directory. |
| `qbx_garages` Lua contract | **1/1 passed**. |
| Property/building PowerShell contracts | **6/6 passed**. |
| Legacy `ps-multijob` Vitest example | Not run: this source package has no installed `node_modules` in the repository. Installing legacy UI dependencies was outside this read-only audit. |
| Changed-file Lua parsing | Generic Lua 5.5 `luac -p` passed both changed firehose files and all new/changed test scripts. It cannot parse the pre-existing FiveM backtick hash syntax in the HUD and police source files; their focused source contracts passed. |
| `git diff --check` | Passed. |

The four existing `bcrp-fires` failures predate and are independent of this focused pass. No JavaScript, TypeScript, SQL, manifest, configuration, trajectory, collision, hose-physics, attachment, aiming, IK, or production geometry behavior changed.

---

## Historical baseline — 2026-07-20

The material below is retained for investigation history. Its paths, priorities, and conclusions are not the current status; use the 2026-09-09 snapshot above for present decisions.

Audit date: 2026-07-20  
Scope: all 221 resource manifests were structurally searched; `[bcrp]`, `[srp]`, and `[qbx]` received the detailed Lua/event/NUI/SQL review requested. Generated `dist`, build output, and `node_modules` were identified but not treated as editable source. This is a static audit, not a profiler capture; runtime cost estimates should be validated with `resmon`, server hitch warnings, and oxmysql slow-query logging.

No source code was changed. The validated fingerprint logic was reviewed only to understand loop behavior and was not modified.

## 1. Executive health summary

Overall health: **functional but carrying several concentrated hotspots**. Modern Ox/Qbox patterns are common in newer BCRP resources (cached ped/vehicle state, ox_target, lib callbacks, state bags, cleanup handlers, transactions). The main risk is not a server-wide plague of `Wait(0)` loops; it is a smaller set of always-on scans, per-frame NUI spam, duplicated compatibility code, and legacy vendor-derived workers.

- **P0:** two concrete correctness/security defects: `qbx_properties` starts a rent thread without its required property ID; SRP clothing bags compare seconds to milliseconds and appear to grant inventory through a client event.
- **P1:** qbx HUD cinematic mode sends two NUI messages every rendered frame; legacy police evidence keeps an unconditional per-frame pickup loop and a separate 10 ms evidence-table scan; ambient radio enumerates the entire vehicle pool every three seconds per client.
- **P1/P2 server:** qbx weed performs two full-table reads plus row-by-row updates on timers; qbx properties creates one long-lived rent coroutine/query schedule per rented property; police blips and cop count remain timer/broadcast driven despite lifecycle events.
- **Good:** spotlight drawing, density multipliers, active cameras, control disabling, markers, and object placement loops are correctly frame-bound only while the feature is active. These loops should remain per-frame.
- **Good:** newer printshop/media/propertytools implementations use callbacks, transactions, server validation, bounded cleanup batches, target zones, and lifecycle cleanup reasonably well.

Confidence is **HIGH** for code-path and structural findings, **MEDIUM** for relative runtime impact without live profiler/DB cardinality data.

## 2. Top 10 highest-value issues

| # | Priority | Finding | Evidence | Impact | Confidence |
|---|---|---|---|---|---|
| 1 | P0 | Rent worker launched without `propertyId` | `[qbx]/qbx_properties/server/property.lua:407-455` | `SELECT ... WHERE id = nil`; rented property may never be charged/evicted correctly | HIGH |
| 2 | P0 | Clothing-bag timeout unit mismatch and insecure-looking grant path | `[srp]/srp-rptools/uniform_handler/server/main.lua:5,12,17-24,33-45` | Five minutes becomes ~3.47 days; client event `ox_inventory:receiveItem` is not an authoritative `AddItem` call | HIGH |
| 3 | P1 | HUD sends two hide messages every frame in cinematic mode | `[qbx]/qbx_hud/client/main.lua:925-939` | 120 NUI messages/s at 60 FPS per client while bars are enabled | HIGH |
| 4 | P1 | Police evidence pickup loop runs every frame even with no nearby evidence | `[bcrp]/qbx_police/client/evidence.lua:247-295` | Permanent client frame cost; repeated metadata/street/weapon-table work when evidence is selected | HIGH |
| 5 | P1 | Ambient radio enumerates every streamed vehicle every 3s per client | `[bcrp]/bcrp-ambient-radio/client/main.lua:199-238` | Cost scales with streamed vehicle count × players | HIGH |
| 6 | P1 | Weed growth/food workers full-scan DB and update rows individually | `[qbx]/qbx_weed/server/main.lua:212-236` | DB amplification, duplicate full scans, global client refresh broadcasts | HIGH |
| 7 | P1 | One rent coroutine/query lifecycle per property | `[qbx]/qbx_properties/server/property.lua:407-431` | Timer/coroutine cardinality and periodic N-query pattern scale with rentals | HIGH |
| 8 | P1 | Police evidence discovery scans three complete evidence maps every 10ms while aiming flashlight | `[bcrp]/qbx_police/client/evidence.lua:297-327` | Expensive during active scenes; duplicates newer BCRP forensics behavior | HIGH |
| 9 | P2 | Player count has duplicate initialization and redundant compatibility/event surface | `[bcrp]/bcrp-playercount/client.lua:23-43`; `server.lua:88-140` | Duplicate initial request/NUI init; extra maintenance/network paths | HIGH |
| 10 | P2 | Police counts/blips are timer-driven global broadcasts | `[bcrp]/qbx_police/server/main.lua:576-592` | Unchanged data broadcast every 10m; position updates every 5s even if no recipients need them | MEDIUM |

## 3. Full meaningful per-frame/high-frequency loop inventory

Classification: **1 required per-frame**, **2 justified but optimizable**, **3 adaptive sleep**, **4 event-driven**, **5 Ox target/zones**, **6 duplicate/dead/legacy**.

| Resource / file / line | Frequency | Purpose and per-frame answer | Class | Priority / action |
|---|---:|---|---:|---|
| bcrp-spotlight `client/client.lua:56` | frame while any light active | `DrawSpotLight` is a this-frame native. **Yes**, it must draw each rendered frame. | 1 | Keep; cache model/class-derived range per light. P3 |
| bcrp-spotlight `client/client.lua:97` | frame only while driver controls; 250ms otherwise | Reads held controls. **Yes while controlling**; event updates are throttled by `Config.UpdateInterval`. | 2 | Keep; verify interval ≥50ms and send only changed quantized values. P2 |
| qbx_density `client/main.lua:35` | frame | Density multipliers are `ThisFrame` natives. **Yes.** | 1 | Keep unchanged. |
| qbx_hud `client/main.lua:925` | frame | Draws cinematic bars, which need frames; NUI hide messages do not. **Partly:** DrawRect yes, repeated messages no. | 2 | Send hide messages once on transition; keep DrawRect/DisplayRadar frame behavior. P1 |
| qbx_hud `client/main.lua:982` | frame or 50ms | Compass/camera heading. **No at full frame rate** for NUI; 50ms is adequate. | 2 | Enforce 50ms, delta threshold, transition-only baseplate state. P2 |
| qbx_hud `client/main.lua:602` | 50/500ms | Player/vehicle HUD native sampling and delta-gated NUI. **No per-frame.** | 2 | Existing delta gating is good; consider 100ms on foot, 50ms driving. P2 |
| qbx_police `client/evidence.lua:202` | frame | Detects shooting edge and casing creation. **Yes**, shooting can occur between coarse polls. | 1 | Keep; confirm weapon cache and server rate limits. |
| qbx_police `client/evidence.lua:247` | frame always | Draw/pickup current evidence. **No** when no current evidence or unauthorized. | 3/5 | Sleep 250–1000ms when all current IDs are zero; ideally target local evidence entities/zones. P1 |
| qbx_police `client/evidence.lua:317` | 10ms while LEO aiming flashlight, 1s otherwise | Scans casing/blood/fingerprint maps. **No**, 10ms is excessive. | 2/6 | Spatially index/stream nearby evidence or consolidate with bcrp-forensics; use 100ms active. P1 |
| qbx_police `client/interactions.lua:392` | returned adaptive delay | Maintains control-disable set while cuffed/escorted. **Yes when disabled**, because controls are frame-scoped (delegated to ox_lib). | 1/3 | Keep. |
| qbx_police `client/objects.lua:170` | frame only when vehicle near spikes | Checks wheel bones against spikes. **Yes near spikes** for collision reliability. | 2 | Keep active branch; cache spike coordinates/bones as already partly done. |
| qbx_police `client/job.lua:332` | frame during evidence bag placement | Raycast/input placement. **Yes while placement UI is active.** | 1 | Keep bounded loop. |
| qbx_police `client/camera.lua:~70-210` | frame while camera active | Camera input/render. **Yes while active.** | 1 | Keep; ensure teardown on resource stop/death. |
| qbx_police `client/heli.lua:~260-300` | frame while helicopter camera/rappel controls active | Input/camera/control natives. **Yes while active.** | 1 | Keep. |
| bcrp-forensics `client/main.lua:292` | frame near collectible, 100ms otherwise | Fallback prompt/control. **Yes only while prompt actionable.** | 3/5 | Acceptable fallback; prefer ox_target configuration where enabled. P3 |
| bcrp-forensics `client/main.lua:359` | `Config.RefreshInterval` | Refreshes scene evidence registry. **No per-frame.** | 2/4 | Retain safety refresh but push add/remove/discover deltas from server; increase idle interval. P2 |
| bcrp-forensics `client/main.lua:363` | 100ms always | Checks flashlight and scans undiscovered evidence. **No per-frame**; 100ms active is reasonable, but idle should sleep longer. | 3 | Use 750–1000ms when unauthorized/not aiming; 100ms only active. P2 |
| bcrp-forensics `client/main.lua:381` | frame near drawn evidence, 1s otherwise | DrawPoly markers. **Yes near streamed marker.** | 1/3 | Keep adaptive design. |
| bcrp-forensics `client/csi_camera.lua:~340` | frame while CSI camera active | Camera controls/overlay. **Yes while active.** | 1 | Keep bounded loop. |
| bcrp-forensics `client/toolbox.lua:~190,430` | frame during toolbox carry/placement | Raycast/input/entity presentation. **Yes while active.** | 1 | Keep; cleanup is present. |
| bcrp-forensics `client/fingerprint_kit.lua` | active-only interaction loop | Fingerprint minigame/input. **Yes only during kit use.** | 1 | Fingerprint logic untouched; no concrete defect found. |
| bcrp-propertytools `client/utils.lua:28` | frame during garage capture | Camera raycast, preview vehicle, confirm/rotate input. **Yes during capture.** | 1 | Keep; ensure every exit deletes preview and hides UI. |
| bcrp-printshop `client/nui.lua:131` | frame only while open, 500ms closed | Escape key close. **No strict need**; NUI can post close/ESC, but cost is bounded. | 2/4 | Move ESC handling into NUI or keybind; low value. P3 |
| bcrp-blackmarket `client/main.lua:~50` | frame during scene/model interaction | Draw/input active state. **Likely yes while active.** | 2 | Retain bounded behavior; no always-on frame loop found. |
| bcrp-recyclingbuyer `client/main.lua:~20` | bounded model load | Waits for model. **No persistent loop.** | 2 | Use `lib.requestModel`; not a runtime hotspot. P3 |
| bcrp-pedclear `client.lua:~25` | zone-active loop | Clears/removes peds while inside configured zone. **No per-frame evidence shown**; zone callback bounds it. | 2 | Raise delay if currently frame-rate; avoid pool scans. P2 |
| bcrp-combat-balance `client.lua:38` | ≥250ms, default 2s | Detects ped handle change despite spawn events. **No per-frame.** | 3/4 | Replace watchdog with `lib.onCache('ped')` plus spawn fallback. P3 |
| bcrp-ambient-radio `client/main.lua:235` | default 3s | Full `CVehicle` pool scan. **No per-frame**, but expensive at scale. | 3/5 | Use nearby model targets/zone/stream events or scan 10–15s and only when player stationary/eligible model nearby. P1 |
| srp-vehiclecontrols `client.lua:147,179` | 500ms each | Helmet suppression and light persistence. **No per-frame.** | 3/4 | Merge into one cache.vehicle transition handler; eliminate two ped/vehicle polls. P2 |
| qbx_bankrobbery `client/doors.lua:90` | inspect configured wait; distance gated | Finds and manipulates bank doors. **No per-frame.** | 3 | Use lib points/onEnter and cache door entities. P2 |
| qbx_bankrobbery `client/fleeca.lua:101,115` | 1s / adaptive | Bank proximity/reset and interaction. **No per-frame except actionable control.** | 3/5 | Target mode is preferred; disable fallback loops when `useTarget=true`. P2 |
| qbx_bankrobbery `client/paleto.lua:126`, `pacific.lua:215` | frame only actionable, 1s idle | Locker input. **Yes only without target and in range.** | 3/5 | Configure target mode. P3 |
| qbx_storerobbery `client/main.lua:222,251` | frame near register/safe; 800ms idle | Prompt and control. **Yes for drawn text/input only nearby.** | 3/5 | With target enabled, do not run prompt loops; consolidate two scans. P2 |
| qbx_towjob `client/main.lua:562` | frame while garage marker flag active, 1s idle | DrawMarker. **Yes while visible.** | 1/3 | Keep. |
| qbx_newsjob `client/camera.lua:127,158,238,359` | 0–10ms while reporter props/cameras active | Animation/input/camera rendering. **Yes for active camera; no for idle held-prop animation checks.** | 2 | Spawn active-only threads and use 100–250ms for animation maintenance. P2 |
| qbx_adminmenu `client/admin.lua` active loops | frame only noclip/dev options; 1s watchdog | Admin controls/camera. **Yes only while admin feature active.** | 1/3 | Keep active loops; replace 1s netCheck watchdog with state transition if possible. P3 |
| qbx_core `client/character.lua:511` | frame until network session starts | Startup gate. **Yes/acceptable**, terminates immediately after session. | 2 | Keep. |
| qbx_core `client/events.lua:221` | frame, max 1s | Waits for network ownership before applying vehicle props. **No indefinite risk; bounded.** | 2 | Add small `Wait(10)` if not already below shown context. P3 |
| qbx_core `client/loops.lua:6` | configured status interval | Starvation/dehydration health tick. **No per-frame.** | 4 | Acceptable configured gameplay timer. |
| qbx_core `server/loops.lua:17,49` | minutes | hunger/thirst/save and paychecks across online players. | 2 | Expected framework work; monitor save burst and stagger if player counts are high. P2 |
| qbx_weed `client/main.lua:352` | result of `updatePlantStats()` | Streams/updates plants. **No per-frame expected.** | 2/3 | Verify inactive return ≥500ms; use state deltas. P2 |
| qbx_weed `server/main.lua:205,214,228` | configured seconds/minutes | broadcasts outside plants; two DB full-table workers. | 2/4 | Merge DB reads, batch SQL updates, publish changed rows only. P1 |
| qbx_properties `server/property.lua:409` | one loop per rented property, hours | rent persistence. | 4/6 | Replace with one indexed due-rent scheduler; first fix missing argument. P0/P1 |
| qbx_houserobbery `client/witness.lua:178` | configured loop | checks player distance to active witness scenes. **No per-frame.** | 3 | Sleep long when no scenes; use point activation per scene. P2 |
| qbx_smallresources `qbx_removeentities/client.lua:3` | 5s | calls `GetClosestObjectOfType` for every configured object. | 4/6 | Delete once on resource start/map load or use `RemoveModelHide`; stop permanent scan. P2 |
| qbx_radialmenu `client/trunk.lua:202,217` | adaptive vehicle/trunk state | trunk interaction/animation. **Only active branch may need frames.** | 2/3 | Keep adaptive; cache vehicle. P3 |
| srp-firescript `server/random.lua:6` | configured long delay | random fire scheduler. | 2 | Acceptable; do not wake when disabled—return before starting thread. P3 |
| srp-rptools uniform cleanup `server/main.lua:34` | 60s | expires bags. | 2 | Fix seconds/ms defect and authoritative inventory API. P0 |
| srp-rptools items cleanup `server/server.lua:118` | configured minutes | scans tracked props for disconnected owners. | 4 | `playerDropped` should be primary; timer remains safety net. P2 |
| bcrp-playercount `server.lua:127` | `RefreshInterval` plus events | player/job presence broadcast, payload-deduped. | 4/6 | Remove periodic loop after confirming all QBX lifecycle hooks; keep slow reconciliation (60s+) if desired. P2 |
| qbx_police `server/main.lua:581,589` | 10m / 5s | cop-count broadcast and blip update. | 4 | Event-driven count; only update blips while duty tracking enabled and recipients exist. P2 |
| bcrp-propertytools `server/buckets.lua:146` | default 10s × all players | bucket correctness watchdog. | 2/4 | Safety-sensitive and justified; iterate tracked players first, reconcile all players less often. P2 |
| bcrp-propertytools `server/buildings/admin.lua:120` | 5s active preview map | preview expiry/death cleanup. | 2 | Sleep/stop when `previews` is empty. P3 |
| bcrp-media `server/rate_limit.lua:21` | 60s | deletes expired in-memory buckets. | 2 | Acceptable; lazy expiry already exists. P3 |
| bcrp-media `server/assets.lua:240` | configured minutes | bounded expired-upload DB/worker cleanup. | 2 | Appropriate; ensure expiry/status indexes. P2 |
| bcrp-forensics `server/main.lua:31,40,66` | configured cleanup/retry/worker ticks | retention, MDT retry, lab worker. | 2/4 | Bounded design; query only due/pending indexed rows and back off when empty. P2 |
| bcrp-forensics `server/forensic_touches.lua:190` | configured seconds | cleans in-memory latent touches. | 2 | Acceptable; fingerprint implementation untouched. |
| bcrp-spotlight `server/server.lua:95` | 30s | removes invalid network entities. | 2/4 | Keep safety sweep; cache one `NetworkGetEntityFromNetworkId` result per item. P3 |

Bounded `Wait(0)` calls used only for model loads, fade completion, entity ownership, startup pagination, or animation sequences were reviewed but are not persistent high-frequency loops. They are acceptable when timeout-bounded; add timeouts where absent.

## 4. Resource-by-resource findings

### Custom code — safe to change

- **bcrp-admintools:** event/menu driven; story-spawn entities have bounded placement work. Confirm all spawned entities are removed on stop. No major always-on hotspot found.
- **bcrp-alerts:** event-driven integration. Keep server authority on dispatch payload and rate-limit public net events.
- **bcrp-ambient-radio:** P1 whole vehicle-pool scan; per-sound 500ms distance watcher is bounded but one thread per playing sound. A single active-sounds manager would reduce coroutine churn.
- **bcrp-blackmarket:** Ox target/menu-oriented. Model-load `Wait(0)` is bounded; use `lib.requestModel` for consistent timeout behavior.
- **bcrp-combat-balance:** correct event hooks plus redundant 2s ped watchdog. `lib.onCache('ped')` can make it event-driven.
- **bcrp-forensics:** generally strong lifecycle design (local entities, targets, cleanup, batched retention, server validation). Optimize idle discovery/refresh; do not alter fingerprint semantics without tests.
- **bcrp-media:** good bounded cleanup and rate limiting. Worker requests inside cleanup rows are serial; modest batch size is important.
- **bcrp-pedclear:** zone-bound approach is preferable to global pool scans. Verify the contains loop has a nonzero wait.
- **bcrp-playercount:** payload comparison prevents unchanged timer broadcasts, but startup is duplicated and legacy events remain. Prefer QBX lifecycle events with one slow reconciliation.
- **bcrp-playerinteractions:** Ox target/global-player options are ecosystem-aligned. Validate distance/job again server-side.
- **bcrp-printshop:** NUI is request-driven; SQL uses transactions for related writes. ESC frame loop is low-value but bounded by open state.
- **bcrp-propertytools:** good target registry and server validation. Bucket watchdog is correctness-oriented but scans all players; active-first reconciliation is cheaper.
- **bcrp-quest-hints:** NUI/event driven; no meaningful persistent Lua loop found.
- **bcrp-recyclingbuyer:** target/menu driven; only bounded model loading.
- **bcrp-roaming:** generation/pending tracking and cleanup are good. Entities appear local unless gameplay requires networking, which is appropriate.
- **bcrp-spotlight:** rendering correctly per-frame only while active. Network updates need an interval floor and quantization; cleanup sweep repeats the net-id native twice.
- **`[bcrp]/qbx_police`:** treat as a modified vendor fork. It mixes legacy evidence and modern Ox/QBX patterns; the evidence loops and global blip/count timers are the main change candidates.

### SRP code

- **srp-arcade:** NUI-focused; no high-value Lua loop issue found in structural scan.
- **srp-firescript:** random scheduler is long interval; gate thread creation when disabled. Vendor/custom lineage should be recorded before edits.
- **srp-props:** no meaningful persistent loop surfaced; review entity ownership/cleanup during functional changes.
- **srp-rptools:** P0 uniform-bag issues; broad bundle increases coupling and lifecycle risk. Split only when maintaining it, not as a performance refactor by itself.
- **srp-vehiclecontrols:** two 500ms polls can become cache transition handlers.
- **srp-welcomehome:** bounded intro/NUI workflow; no persistent hotspot found.

### Vendor / modified vendor

- **qbx_hud:** P1 cinematic NUI spam and P2 compass cadence. Patch carefully or upstream/rebase.
- **qbx_properties:** P0 missing rent argument and P1 per-property rent workers. This repository also has BCRP property tooling, so ownership boundaries must be explicit.
- **qbx_weed:** P1 full-table worker design. Prefer upstream-compatible config/patch and DB batching.
- **qbx_bankrobbery/storerobbery/newsjob:** legacy distance/input loops; target configuration removes much of the idle work.
- **qbx_density/core:** important loops are justified framework/frame-native work. Do not optimize blindly.
- **qbx_smallresources/removeentities:** permanent 5s polling is avoidable.

## 5. Network/event/callback inefficiencies

1. Spotlight input can emit server updates repeatedly while a key is held (`bcrp-spotlight/client/client.lua:125-127`), followed by a broadcast to all clients. Add a hard server/client rate floor, quantize heading/pitch, and optionally route only to relevant clients. Expected benefit: lower event traffic; risk LOW.
2. Police cop count broadcasts every 10 minutes even unchanged. Listen to QBX job/duty/player lifecycle and retain a slow deduped reconciliation. Benefit: fewer global events; risk LOW-MEDIUM.
3. Police blip updates every five seconds should run only when tracking is enabled and recipients exist; avoid `-1` if only LEO clients need it. Benefit scales with players; risk MEDIUM.
4. Playercount duplicates resource-start initialization: the startup thread and `onResourceStart` handler both execute for its own start. Collapse to one path. Benefit small but certain; risk LOW.
5. Playercount exposes both new and legacy request/update names. Confirm no callers with event-log/`rg` evidence, then remove compatibility handlers. Risk MEDIUM until deployment usage is confirmed.
6. qbx weed globally tells every client to refresh after both worker passes. Send changed plant IDs/state once after a combined pass. Risk MEDIUM.
7. Forensics discovery retries are client-triggered but server validated; pending/retry guards are good. The periodic full refresh should become a reconciliation fallback, not primary sync.
8. Public `RegisterNetEvent` handlers should remain server-authoritative for distance, job, ownership, item counts, and entity existence. Newer BCRP systems generally do this; SRP uniform bags do not meet that bar.

## 6. NUI/frontend inefficiencies

- **P1:** qbx HUD cinematic loop sends `{hudtick=false}` and `{car=false}` every frame. Send once when `w` transitions from zero, and once when it returns to zero; keep only `DrawRect` per-frame.
- qbx HUD compass already suppresses identical headings but can still send up to frame rate during rotation. Cap at 20 Hz (50ms) and use a 1–2 degree threshold.
- bcrp-playercount initial `init` and count request can occur twice. Make initialization idempotent or use only `onClientResourceStart`.
- bcrp-printshop and media NUI messages are action-driven, not spammy. Their generated frontend bundles should not be patched directly; change source and rebuild.
- bcrp-ambient-radio sends only play/stop messages. The expensive portion is entity discovery, not NUI cadence.

## 7. Database/oxmysql findings

- **qbx_properties rent:** one `SELECT` per property per rent interval plus one coroutine/property is an N-scheduler design. Replace with `rent_due_at` (or equivalent existing timestamp) and one indexed batch worker. Immediate minimal fix is `startRentThread(propertyId)` at line 455. Expected benefit HIGH; regression risk LOW for argument fix, MEDIUM-HIGH for scheduler redesign.
- **qbx_weed:** two independent `SELECT ... FROM weed_plants` full scans then likely row-level updates. Combine reads, calculate both food/growth changes, issue a transaction/batch, and broadcast changed IDs. Ensure indexes on `property`, `id`, and any due-time/status field. Benefit HIGH at plant scale; risk MEDIUM.
- **bcrp-media:** cleanup uses `status='pending'`, unused session, expiry, and limited batches. Verify composite indexes supporting status/expiry and session expiry. Serial external DELETE + two DB updates per row is intentionally bounded; do not parallelize without worker rate-limit semantics.
- **bcrp-forensics:** retention, MDT pending, and processing workers must have indexes on status/due/expiry columns. Startup expiration is batched and yields, which is safe. Pending MDT should be limited/batched if `Repository.pendingMdt()` is currently unbounded.
- **bcrp-printshop:** bootstrap performs three bounded owner/status reads. Add/verify indexes for owner citizen ID, document status/current revision, revision status, print owner/voided state, asset UUID, and review timestamps. Transactions are correctly used for multi-table state changes.
- **bcrp-propertytools:** list/admin queries contain correlated counts, appropriate for admin/on-demand paths. Compatibility import does a query per entry (`server/buildings/compatibility.lua:65`); acceptable only as startup/migration work, not runtime. Slug generation queries until unique; a UNIQUE key remains the authoritative guard.
- Avoid changing `.await` merely because it yields: oxmysql await calls are coroutine-friendly. The issue is query cardinality/location, not syntax.

No live database schema/cardinality or `EXPLAIN` output was available, so missing-index conclusions are recommendations to verify, not asserted facts.

## 8. Entity/target/zone lifecycle findings

- BCRP forensics uses local marker entities and `ox_target:addLocalEntity`, then removes targets/entities; this is aligned and avoids unnecessary networking.
- BCRP roaming uses local presentation entities and generation guards; good fit. Confirm `onResourceStop` cleans ped, vehicle, props, target registrations, and model references.
- Spotlight must use networked vehicle IDs because other clients render the same attached light; server cleanup is justified.
- SRP uniform bags and SRP item props require stricter server ownership/existence/distance validation and `playerDropped` cleanup. Do not trust a caller-supplied net ID alone.
- qbx smallresources removal should not rediscover the same world object every five seconds forever. Use map/model hiding or one-time deletion plus resource/map lifecycle reapply.
- Bank/store robbery fallback proximity loops should be disabled when Ox target is configured; do not run both interaction systems.
- Propertytools target registries remove old zones before rebuilding, which is correct. Avoid rebuilding on unchanged registry revisions.

## 9. Resource load-order/dependency findings

- Newer BCRP manifests generally declare `ox_lib`, `oxmysql`, `qbx_core`, and direct integrations. Continue declaring every export/event dependency explicitly rather than relying on folder start order.
- `bcrp-media` correctly declares `screenshot-basic`; printshop/forensics integrations should treat media as an explicit dependency or optional dependency with resource-state guards, matching actual required behavior.
- `[bcrp]/qbx_police` is a vendor fork outside `[qbx]`; ensure server configuration starts only this copy and never a second qbx_police resource.
- qbx_properties and bcrp-propertytools both operate on property/bucket state. Document which owns entry/exit, rent, garage registration, and bucket watchdog to avoid duplicated lifecycle work.
- Backup Lua files under qbx_core (`events-bu.lua`, `events_citizenaccess-bu.lua`) are update/confusion hazards. They do not run unless included, but should live outside the resource tree or version history after verifying no manifest inclusion.
- Generated frontend `dist`/build assets and `node_modules` are vendor/generated class D. Do not hand-edit; source-build only.

## 10. Dead/legacy code candidates

- `[qbx]/qbx_core/server/events-bu.lua` and `events_citizenaccess-bu.lua` — backup copies, remove from deploy tree after checksum/history confirmation. P3, HIGH.
- bcrp-playercount `bc_playercount:*` compatibility events — remove after confirming no external callers. P3, MEDIUM.
- qbx bank/store non-target loops — dead at runtime only if `useTarget=true`; verify config and remove/leave gated accordingly. P3, HIGH after config check.
- Duplicate qbx HUD legacy behaviors around cinematic visibility — transition messages supersede frame messages. P1, HIGH.
- Parallel old qbx_police evidence versus bcrp-forensics — likely overlapping evidence systems. Map exact enabled producers/items/commands before removal; do not merge blindly. P1/P2, MEDIUM.

## 11. Vendor-update overwrite risks

- **A custom, safe to change:** named `bcrp-*` resources and confirmed in-house SRP code.
- **B modified vendor:** `[bcrp]/qbx_police` and locally patched files under `[qbx]`. Maintain small commits/patch notes; upstream updates can overwrite fixes.
- **C vendor config only:** prefer enabling Ox target, increasing refresh intervals, and disabling unused fallback systems through config before source patches.
- **D generated frontend/dist:** never edit compiled JS/CSS directly. Modify source and rebuild so changes survive upgrades.

Before upgrading qbx resources, keep a patch ledger for qbx_hud cinematic/compass, qbx_properties rent, qbx_weed batching, qbx_smallresources entity removal, and any local forensics integrations.

## 12. Recommended optimization roadmap

### Phase 1 — safest / highest impact

1. Fix `startRentThread(propertyId)` and add a regression test for rent start/charge/eviction.
2. Fix SRP bag timeout units (`bagTimeoutSeconds=300` or milliseconds using `GetGameTimer`) and replace client inventory grant with server `exports.ox_inventory:AddItem`; validate entity ownership/distance.
3. Make qbx HUD cinematic NUI hide messages transition-only.
4. Add adaptive sleep to qbx_police evidence pickup loop; cap active discovery at ~100ms.
5. Remove duplicate bcrp-playercount initialization; dedupe broadcasts on event refresh too.
6. Confirm Ox target config disables robbery fallback loops.

### Phase 2 — moderate changes

1. Replace ambient radio global pool scan with streamed/targeted eligibility, or at minimum 10–15s adaptive scanning.
2. Combine qbx weed workers and batch changed rows/events.
3. Gate police blips by active LEO recipients and tracking state; event-drive cop count.
4. Convert SRP vehicle state polling to `lib.onCache('vehicle')` plus a bounded exit-state handler.
5. Make forensics refresh delta-driven with slow reconciliation; add idle backoff.
6. Iterate active property buckets every 10s and full-player reconcile less frequently.

### Phase 3 — optional cleanup

1. Redesign property rent as one due-row scheduler.
2. Remove verified legacy events/backups and duplicate evidence implementation.
3. Move printshop ESC handling to NUI/keybind.
4. Upstream/rebase vendor fixes and maintain the patch ledger.

## 13. Exact proposed fixes

| File | Current pattern | Recommended pattern | Expected benefit | Regression risk |
|---|---|---|---|---|
| `[qbx]/qbx_properties/server/property.lua:455` | `startRentThread()` | `startRentThread(propertyId)` plus test | Restores rent worker correctness | LOW |
| `[srp]/srp-rptools/uniform_handler/server/main.lua:5-24` | ms constant compared with `os.time`; client grant event | seconds constant; `AddItem` server-side; validate net entity/owner/distance | Correct cleanup and authoritative inventory | LOW-MEDIUM |
| `[qbx]/qbx_hud/client/main.lua:925-939` | two NUI messages/frame | state-transition messages; keep DrawRect frame loop | Removes up to 120 messages/s/client | LOW |
| `[bcrp]/qbx_police/client/evidence.lua:247-327` | unconditional frame loop + 10ms map scans | idle 500–1000ms; active 0 only for draw/input; spatial/100ms discovery | Lower client CPU at all times | LOW-MEDIUM |
| `[bcrp]/bcrp-ambient-radio/client/main.lua:199-238` | `GetGamePool('CVehicle')` every 3s | adaptive 10–15s or streamed/model-target registry | Lower cost proportional to clients/entities | MEDIUM |
| `[qbx]/qbx_weed/server/main.lua:212-236` | two full selects and global refreshes | combined select/calculation, transaction/batch, changed IDs | Lower DB and network amplification | MEDIUM |
| `[bcrp]/qbx_police/server/main.lua:581-592` | timed count/blip global sends | lifecycle count; recipient-gated blip timer | Lower server/network work | MEDIUM |
| `[bcrp]/bcrp-playercount/client.lua:23-43` | startup thread and own-start handler | one idempotent initializer | Removes duplicate init/request | LOW |
| `[srp]/srp-vehiclecontrols/client.lua:146-207` | two 500ms ped/vehicle polls | vehicle cache transition + one safety timer | Fewer native calls/coroutines | MEDIUM |
| `[qbx]/qbx_smallresources/qbx_removeentities/client.lua:3-16` | per-object search every 5s forever | one-time/model-hide lifecycle strategy | Removes permanent native scan | MEDIUM |
| `[bcrp]/bcrp-propertytools/server/buckets.lua:146-183` | all-player scan every 10s | tracked-player scan + slow global reconciliation | Lower server native calls | MEDIUM |
| `[bcrp]/bcrp-forensics/client/main.lua:359-405` | periodic full refresh and 100ms idle flashlight check | server deltas + slow reconcile; long idle sleep | Lower client/server callback and table scan cost | MEDIUM |

## 14. Loops that must remain per-frame

- qbx_density density multiplier calls: the natives apply only to the current frame.
- Spotlight `DrawSpotLight`: the light must be submitted each frame while active.
- DrawMarker/DrawPoly/DrawRect/3D-text rendering: only while visible/near/active.
- Control disabling: disabled controls must be applied each frame while cuffed/escorted or in an active camera/minigame.
- Active camera and held-input controls: input edges, camera movement, raycast placement, and scaleforms need frame resolution during the active interaction.
- Shooting detection/casing creation: a coarse timer can miss shots; retain frame detection with server validation/rate limits.
- Spike collision wheel checks: frame resolution is justified only while a vehicle is close enough to a spike strip.

Everything above should be dormant or on adaptive sleep when its feature is inactive. The audit does **not** recommend eliminating these required loops.

## 15. Validated fingerprint logic

No concrete performance or correctness defect was established in the validated fingerprint semantics. The surrounding BCRP forensics discovery/marker scheduling can be optimized independently. Fingerprint behavior, matching, chance, glove checks, custody, and persistence should remain untouched unless a focused test demonstrates a defect.

## 16. FIVEM ECOSYSTEM FIT

| Major system | Fit | Assessment |
|---|---|---|
| bcrp-forensics | Aligned with current Qbox/Ox patterns | Server-authoritative evidence, ox_inventory metadata/hooks, local target entities, callbacks, cleanup. Scheduling needs modest backoff/delta sync. |
| bcrp-printshop / bcrp-media | Aligned | Request-driven NUI, lib callbacks, oxmysql transactions, server permissions, bounded cleanup. |
| bcrp-propertytools | Acceptable custom implementation | Ox target and server validation fit well; watchdog is justified safety logic. Clarify ownership with qbx_properties. |
| bcrp-playerinteractions / blackmarket / recyclingbuyer | Aligned | Ox target/menu-driven and mostly event-based. |
| bcrp-roaming | Acceptable custom implementation | Local presentation entities and explicit lifecycle tracking are appropriate. |
| bcrp-spotlight | Acceptable custom implementation | Custom rendering is necessary; event fan-out/throttling can improve. |
| bcrp-ambient-radio | Legacy pattern worth replacing | Whole entity-pool polling per client is disproportionate to ecosystem tooling/stream activation. |
| `[bcrp]/qbx_police` evidence | Legacy pattern worth replacing/consolidating | Mixed old polling/draw-text evidence beside a newer dedicated forensics system. Map features before decommissioning. |
| qbx_hud | Acceptable vendor system with a concrete hot path | Core HUD delta gating is sensible; cinematic NUI frame spam is not. |
| qbx_properties rent | Legacy pattern worth replacing | Per-property coroutines and a concrete missing-argument bug; a single due scheduler fits server persistence better. |
| qbx_weed | Legacy pattern worth replacing | Periodic full-table scans/row updates/global refreshes should be batched and delta-driven. |
| qbx robbery interactions | Config-dependent | Acceptable when Ox target mode disables fallback polling; legacy otherwise. |
| SRP vehicle controls | Legacy pattern worth replacing | Polling works but cache transition events express the state more directly. |
| SRP uniform/items | Misaligned/security-sensitive legacy | Inventory grants and network entity lifecycle should be server-authoritative Ox patterns. |
| qbx_core / qbx_density | Aligned | Framework timers and this-frame natives are justified; do not rewrite merely to remove loops. |

The practical target is not zero loops: it is to retain frame loops only for frame-scoped natives and active interactions, while moving discovery, lifecycle, persistence, and state synchronization to events, bounded reconciliation, and indexed batch work.
