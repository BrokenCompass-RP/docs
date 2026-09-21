---
title: BCRP HUD/UI redundancy audit
description: ''
default_visibility: developer
---
# BCRP HUD/UI redundancy audit

Audit date: 2026-07-28  
Branch: `BCRP-Ezi-Dev-UI`  
Scope: the 225 `fxmanifest.lua` / `__resource.lua` manifests and their client, server, configuration, source-front-end, and compiled-front-end files under `resources/`.  
Method: static review only. No resource code or configuration was changed. Runtime-only behavior remains called out for validation.

## Executive summary

The server already has one ambient HUD, `qbx_hud`, and a second voice overlay from `pma-voice`. `qbx_hud` renders player status, voice/radio, a basic vehicle HUD, compass/streets, account changes, minimap shape/position, cinematic bars, and radar visibility. It polls most player and vehicle values every 50 ms and can run a second compass loop every frame. Its front end is a bundled NUI (`[qbx]/qbx_hud/html/index.html`; manifest at `[qbx]/qbx_hud/fxmanifest.lua:22-28`).

`bcrp-hud` should replace the persistent visuals in `qbx_hud`, not absorb the gameplay systems feeding them. The safest implementation is a new custom resource with small adapters for Qbox state bags, `pma-voice`, `ox_fuel`, and cruise/seatbelt providers. Stop `qbx_hud` only after parity testing; do not edit its vendor bundle.

Highest-priority findings:

1. `pma-voice` UI is enabled by `setr voice_enableUi 1` in `voice.cfg:37`. That overlay duplicates voice range, talking, and radio information (`[voice]/pma-voice/voice-ui/src/App.vue:5-13`). Set it to `0` only after `bcrp-hud` consumes the same state.
2. `qbx_hud` combines rendering with stress effects, low-fuel notifications, cinematic bars, minimap configuration, account popups, and gameplay-facing event compatibility. Simply stopping it will remove more than visuals.
3. The tree references `exports.qbx_seatbelt:HasHarness()` at `[qbx]/qbx_radialmenu/client/main.lua:209`, but no `qbx_seatbelt` manifest exists in the 225-resource inventory. `qbx_hud` reads `LocalPlayer.state.seatbelt` and `.harness` at lines 666, 709, 719, and 1044. Seatbelt/harness ownership is therefore unresolved and requires runtime/startup-log validation.
4. Cruise logic is in `[qbx]/qbx_smallresources/qbx_cruise/client.lua:27-83`. It communicates visual state only through the legacy toggle event `seatbelt:client:ToggleCruise` (lines 33, 44, 55, 61). A toggle event can desynchronize after restarts; expose/set an absolute boolean instead.
5. `ox_fuel` is the canonical fuel owner. It writes both the native fuel level and `Entity(vehicle).state.fuel` at `[ox]/ox_fuel/client/fuel.lua:10-45`, and consumes fuel at `[ox]/ox_fuel/client/init.lua:19-67`. The HUD must remain read-only.
6. Several resources independently call `DisplayRadar`; without a reason-based visibility arbiter, spawn, appearance, properties, police cameras, pause state, and `/hideui` can race.
7. The existing `qbx_hud` does not provide RPM or gear values. `bcrp-hud` will need native reads for `GetVehicleCurrentRpm` and `GetVehicleCurrentGear`, restricted to an in-vehicle update loop.

Recommended disposition:

- Build `bcrp-hud` as the sole persistent ambient player/vehicle HUD and minimap framer.
- Keep `qbx_core`, `qbx_smallresources`, `ox_fuel`, and `pma-voice` as state/gameplay owners.
- Keep NPWD, inventory, banking, MDT, dispatch, menus, dialogs, notifications, progress, TextUI, character/spawn, appearance, minigames, and spatial interaction UIs out of scope.
- Add compatibility adapters for legacy `hud:client:*` producers before retiring `qbx_hud`.
- Use reason-counted visibility, not a single boolean.

## Manifest and asset inventory

The audit found 225 manifests. Forty-nine declare `ui_page`; two more declare load screens. `files {}` alone was not treated as proof of player UI because many map, vehicle, clothing, SQL, locale, and audio resources use it only to mount assets.

Dedicated NUI/load-screen resources:

| Resource | Manifest evidence | Front-end form | Classification |
|---|---|---|---|
| `qbx_hud` | `[qbx]/qbx_hud/fxmanifest.lua:22-28` | bundled HTML/CSS/JS | **KEEP LOGIC / REPLACE VISUALS** |
| `pma-voice` | `[voice]/pma-voice/fxmanifest.lua:30-37` | source Vue app plus compiled `ui/` | **CONFIG-DISABLE** after adapter |
| `qbx_radio` | `[voice]/qbx_radio/fxmanifest.lua:23-32` | radio-device NUI | **KEEP AS-IS** |
| `npwd` | `[npwd]/npwd/fxmanifest.lua:17` | compiled phone | **OUT OF BCRP-HUD SCOPE** |
| `npwd_qbx_mail`, `npwd_qbx_garages` | manifests `:17`, `:21` | compiled NPWD apps | **OUT OF BCRP-HUD SCOPE** |
| `bcrp-phone-directory`, `bcrp-phone-property-finder` | manifests `:25`, `:24` | compiled NPWD apps | **OUT OF BCRP-HUD SCOPE** |
| `ox_inventory` | `[ox]/ox_inventory/fxmanifest.lua:33-40` | compiled inventory | **OUT OF BCRP-HUD SCOPE** |
| `ox_lib` | `[ox]/ox_lib/fxmanifest.lua:19-25` | compiled menus/dialog/TextUI/notify/progress | **KEEP AS-IS** |
| `ox_target` | `[ox]/ox_target/fxmanifest.lua:15,29-37` | target eye/options | **KEEP AS-IS** |
| `ox_doorlock` | `[ox]/ox_doorlock/fxmanifest.lua:30-38` | compiled door editor/UI | **OUT OF BCRP-HUD SCOPE** |
| `oxmysql` | `[ox]/oxmysql/fxmanifest.lua:26` | internal/debug web UI | **OUT OF BCRP-HUD SCOPE** |
| `Renewed-Banking` | `[standalone]/Renewed-Banking/fxmanifest.lua:28-34` | source/public banking | **OUT OF BCRP-HUD SCOPE** |
| `ps-mdt` | `[standalone]/ps-mdt/fxmanifest.lua:11,33-37` | compiled MDT | **OUT OF BCRP-HUD SCOPE** |
| `ps-dispatch` | `[standalone]/ps-dispatch/fxmanifest.lua:10,27-32` | dispatch panel/alerts | **OUT OF BCRP-HUD SCOPE** |
| `illenium-appearance` | `[standalone]/illenium-appearance/fxmanifest.lua:91-96` | compiled appearance UI | **OUT OF BCRP-HUD SCOPE** |
| `qbx_spawn` | files in `[qbx]/qbx_spawn/fxmanifest.lua:20-23` and NUI calls in `client/main.lua` | spawn selector | **OUT OF BCRP-HUD SCOPE** |
| `qbx_properties` | files in manifest `:34-38`; apartment selector | property/apartment selection | **OUT OF BCRP-HUD SCOPE** |
| `chat` | `[cfx-default]/[gameplay]/chat/fxmanifest.lua:9-18` | compiled chat | **OUT OF BCRP-HUD SCOPE** |
| `loadscreen`, `example-loadscreen` | manifests `:24`, `:16` | loading screens | **REMOVE AFTER VALIDATION** for unused example; keep configured loadscreen |
| `qbx_taxijob` | `[qbx]/qbx_taxijob/fxmanifest.lua:20-25` | taxi meter | **OUT OF BCRP-HUD SCOPE** |
| `wk_wars2x` | `[standalone]/wk_wars2x/fxmanifest.lua:56` | police radar NUI | **KEEP AS-IS**; vehicle instrument, not player HUD |
| `qbx_police` | `[bcrp]/qbx_police/fxmanifest.lua:26-32` | evidence/camera/job UI | **OUT OF BCRP-HUD SCOPE** |
| `qbx_idcard` | `[qbx]/qbx_idcard/fxmanifest.lua:31-38` | ID card display | **OUT OF BCRP-HUD SCOPE** |
| `qbx_vehiclesales` | `[qbx]/qbx_vehiclesales/fxmanifest.lua:25-30` | sales UI | **OUT OF BCRP-HUD SCOPE** |
| `qbx_storerobbery`, `qbx_bankrobbery` | manifests `:21`, `:8` | robbery/minigame UI | **OUT OF BCRP-HUD SCOPE** |
| `srp-welcomehome` | `[srp]/srp-welcomehome/fxmanifest.lua:17-26` | welcome/onboarding | **OUT OF BCRP-HUD SCOPE** |
| `srp-arcade`, `d3-arcade` | manifests `:31`, `:38` | arcade games | **OUT OF BCRP-HUD SCOPE** |
| `srp-rptools` | `[srp]/srp-rptools/fxmanifest.lua:71-79` | fire-vest overlay plus tools | **NEEDS MANUAL REVIEW** for persistent emergency overlay |
| `bcrp-playercount` | `[bcrp]/bcrp-playercount/fxmanifest.lua:10-17` | player-count overlay | **NEEDS MANUAL REVIEW**; do not merge without design decision |
| `bcrp-quest-hints` | `[bcrp]/bcrp-quest-hints/fxmanifest.lua:24-29` | contextual hint overlay | **KEEP AS-IS** |
| `bcrp-media` | `[bcrp]/bcrp-media/fxmanifest.lua:30-37` | media viewer | **OUT OF BCRP-HUD SCOPE** |
| `bcrp-printshop` | `[bcrp]/bcrp-printshop/fxmanifest.lua:36-42` | document/print UI | **OUT OF BCRP-HUD SCOPE** |
| `bcrp-ambient-radio` | `[bcrp]/bcrp-ambient-radio/fxmanifest.lua:19-24` | audio controller NUI | **KEEP AS-IS** |
| `firehose` | `[standalone]/firehose/fxmanifest.lua:18-23` | hose UI | **OUT OF BCRP-HUD SCOPE** |
| `randol_medical` | `[standalone]/randol_medical/fxmanifest.lua:10,29` | medical interaction UI | **OUT OF BCRP-HUD SCOPE** |
| `ps-multijob` | `[standalone]/ps-multijob/fxmanifest.lua:15-20` | job menu | **OUT OF BCRP-HUD SCOPE** |
| `qs-tutorial` | `[standalone]/qs-tutorial/fxmanifest.lua:16-22` | tutorial | **OUT OF BCRP-HUD SCOPE** |
| `kq_propplacer` | `[standalone]/kq_propplacer/fxmanifest.lua:9,44-51` | placement editor | **OUT OF BCRP-HUD SCOPE** |
| `mhacking`, `ultra-voltlab` | manifests `:5`, `:26` | minigames | **OUT OF BCRP-HUD SCOPE** |
| `MugShotBase64` | `[standalone]/MugShotBase64/fxmanifest.lua:8-13` | capture helper | **OUT OF BCRP-HUD SCOPE** |
| `screenshot-basic`, `screencapture` | manifests `:11`, `:12` | capture helpers | **OUT OF BCRP-HUD SCOPE** |
| `interact-sound`, `xsound` | manifests `:12`, `:38` | audio NUI (normally invisible) | **KEEP AS-IS** |
| `ps_lib` | `[standalone]/ps_lib/fxmanifest.lua:42` | shared vendor UI toolkit | **KEEP AS-IS** |
| `runcode` | `[cfx-default]/[system]/runcode/fxmanifest.lua:21-25` | developer console UI | **REMOVE AFTER VALIDATION** on production |

### API/native UI producers without a dedicated `ui_page`

These resources were found through NUI calls, native drawing, `ox_lib` UI calls, radar/HUD natives, or bundled library calls. They produce transient or task-specific UI and should remain outside `bcrp-hud` unless explicitly noted.

| Resource(s) | UI/API observed | Recommendation |
|---|---|---|
| `qbx_core` | notifications, character camera/radar, legacy HUD events | **INTEGRATE STATE INTO BCRP-HUD**; keep all core logic |
| `qbx_smallresources` | notifications, cruise events, HUD-component suppression | **KEEP LOGIC / REPLACE VISUALS** only for cruise indication |
| `ox_fuel` | Text entries, notify, progress circle, target prompts | **KEEP AS-IS**; integrate fuel state only |
| `qbx_radialmenu`, `qbx_adminmenu`, `qbx_management`, `qbx_cityhall`, `qbx_garages`, `qbx_customs`, `qbx_vehicleshop`, `qbx_vehiclekeys` | menus/contexts/notifications/TextUI | **OUT OF BCRP-HUD SCOPE** |
| `qbx_busjob`, `qbx_towjob`, `qbx_truckerjob`, `qbx_garbagejob`, `qbx_recyclejob`, `qbx_scrapyard`, `qbx_vineyard`, `qbx_weed`, `qbx_pawnshop` | job prompts/progress/notifications | **OUT OF BCRP-HUD SCOPE** |
| `qbx_carwash`, `qbx_divegear`, `qbx_diving`, `qbx_drugs`, `qbx_fireworks`, `qbx_houserobbery`, `qbx_jewelery`, `qbx_newsjob`, `qbx_truckrobbery`, `qbx_binoculars` | activity UI/native overlays | **OUT OF BCRP-HUD SCOPE** |
| `bcrp-admintools`, `bcrp-blackmarket`, `bcrp-forensics`, `bcrp-pedclear`, `bcrp-playerinteractions`, `bcrp-propertytools`, `bcrp-recyclingbuyer`, `bcrp-spotlight` | notify/TextUI/progress/context/task UI | **OUT OF BCRP-HUD SCOPE** |
| `srp-firescript`, `srp-vehiclecontrols`, `bcrp_lunapark` | notifications/prompts | **OUT OF BCRP-HUD SCOPE** |
| `elevators` | menu/TextUI | **OUT OF BCRP-HUD SCOPE** |
| `xt-prison`, `wasabi_fishing`, `it-drugs`, `randol_prescriptions`, `randol_pulsecheck`, `stretcher`, `force-sling` | activity-specific menus/prompts/progress/native UI | **OUT OF BCRP-HUD SCOPE** |
| `scully_emotemenu`, `citra_bridge`, `jim_bridge`, `kq_link` | menu/notification/progress abstraction | **OUT OF BCRP-HUD SCOPE** |
| `bob74_ipl`, `fivem-aerial-tramway`, `Prisoncanteen` | native prompt/drawing helpers | **OUT OF BCRP-HUD SCOPE** |

The static signal scan also matched bundled implementations inside `ox_lib`, `ps_lib`, `ps-mdt`, `jim_bridge`, `kq_link`, and appearance/phone front ends. Those are vendor/library implementations, not additional ambient HUD owners.

## Complete UI-producing resource decision table

The preceding inventory names every resource matched by a dedicated NUI manifest or a source-level UI/native signal. The table below expands the resources with HUD-adjacent impact; task UIs retain the classifications above.

| Resource | Resource type | UI produced | State owned | Trigger/API | Update method | Config disable available | Keep logic | Keep visuals | Replace visuals | Integrate with bcrp-hud | Risk/notes |
|---|---|---|---|---|---|---|---:|---:|---:|---:|---|
| `qbx_hud` | Qbox vendor | status HUD, voice/radio, vehicle speed/fuel/seatbelt, engine, compass/streets, accounts, minimap, cinematic bars | stress gameplay; local UI state only for cruise mirror | `hud:client:*`, `qbx_hud:client:*`; NUI actions `hudtick`, `car`, `baseplate` | 50 ms player/vehicle loop; optional frame compass loop | per-element settings, but no master “visuals off while logic on” | Yes, temporarily | No | Yes | Compatibility source during migration only | Stopping removes stress effects/commands/account popups. Vendor update risk. |
| `pma-voice` | voice vendor | range/radio/call text overlay | proximity, talking/radio activity, radio channel | state bags `proximity`, `radioChannel`, `radioActive`; event `pma-voice:radioActive` | event/state driven plus refresh loop | `voice_enableUi` | Yes | No after adapter | Yes | Yes | Set convar to `0`, avoid source edit. |
| `qbx_radio` | Qbox vendor | handheld radio device/menu | selected channel UI mirror; delegates canonical channel to `pma-voice` | `qbx_radio:client:use`, NUI callbacks; `pma-voice:setRadioChannel` export | interaction driven | no need | Yes | Yes | No | No; read `pma-voice` state | This is an interactive device, not ambient HUD. |
| `qbx_smallresources/qbx_cruise` | Qbox vendor module | notifications only; HUD event | cruise mechanics and local target speed | `seatbelt:client:ToggleCruise` | frame loop only while active (`client.lua:36-67`) | module inclusion via manifest/config structure | Yes | notifications yes | indicator only | Yes | Toggle event is not restart-safe. |
| missing `qbx_seatbelt` | unresolved dependency | expected seatbelt/harness mechanics | expected `seatbelt`, `harness` state | referenced export/state only | unknown | unknown | Yes | unknown | indicator only | Yes | No resource exists in tree; validate. |
| `ox_fuel` | ox vendor | refuel prompts/progress/notify | consumption, native level, entity `fuel` state | `Entity(vehicle).state.fuel`; fuel natives | 1 s driver loop; refill tick | target choice only | Yes | Yes | No | Yes, read-only | Never move consumption/payment into HUD. |
| `qbx_core` | Qbox vendor | notifications; character transition radar | player metadata/state and loaded/dead status | Qbox events, `LocalPlayer.state`, player state bags | state/event plus core loops | no | Yes | Yes | No | Yes | Canonical hunger/thirst/stress owner. |
| `qbx_spawn` | Qbox vendor | spawn selection | spawn flow | NUI/focus, `DisplayRadar` | selection/frame suppression | no simple HUD hook | Yes | Yes | No | visibility reason `spawn` | Direct radar calls can race. |
| `qbx_properties` | Qbox vendor | apartment selection | property selection | NUI/native HUD suppression | selection/frame suppression | no | Yes | Yes | No | visibility reason `character` | Direct radar calls can race. |
| `illenium-appearance` | vendor | appearance editor | customization flow | focus and `DisplayRadar` | session driven | `Config.HideRadar` (`game/customization.lua:558,573`) | Yes | Yes | No | visibility reason `appearance` | Prefer adapter/event over vendor edit. |
| `qbx_police` | BCRP-owned fork/custom | camera/evidence UI | police camera state | `DisplayRadar` at `client/camera.lua:77,152`; HUD-component hides in `heli.lua:66` | camera/frame | source-owned by BCRP | Yes | Yes | No | visibility reason `camera` | Safe custom adapter point. |
| `qbx_smallresources/qbx_hudcomponents` | Qbox vendor config module | suppresses native GTA HUD | suppression policy | `HideHudComponentThisFrame` | every frame | config list at `config.lua:2-10` | Yes | N/A | N/A | coordinate policy | Keep weapon/ammo/native suppression decision explicit. |
| `wk_wars2x` | vendor | police moving/stationary radar | radar readings | NUI radar | active vehicle loop | resource-specific | Yes | Yes | No | No | Do not confuse with GTA minimap. |
| `bcrp-playercount` | custom | persistent/command player-count overlay | online count | NUI | event/command | inspect runtime | Yes | manual decision | manual decision | optional | Visual collision risk near HUD. |
| `srp-rptools` | custom/legacy | fire-vest overlay | equipment/action state | NUI | event driven | inspect runtime | Yes | manual decision | manual decision | possibly icon adapter | Validate emergency roles. |
| `ps-dispatch` | vendor | dispatch alerts/panel | dispatch calls | NUI/events | event driven | vendor config | Yes | Yes | No | no | Alerts are transient task UI. |

## State ownership map

| State | Canonical owner | Current displays | Recommended bcrp-hud input | Event/export/state bag available | Polling required | Notes |
|---|---|---|---|---|---:|---|
| Voice talking | Mumble/`pma-voice` | `pma-voice`, `qbx_hud` | `NetworkIsPlayerTalking(PlayerId())`, sampled with HUD tick | native; pma NUI uses cached talking | Yes, low-cost | `qbx_hud` reads at `client/main.lua:632`. |
| Radio talking | `pma-voice` | `pma-voice`; `qbx_hud` currently conflates general talking | `LocalPlayer.state.radioActive` or `pma-voice:radioActive` | both at `[voice]/pma-voice/client/module/radio.lua:209-251` | No | Use absolute boolean state. |
| Voice proximity | `pma-voice` | both current HUDs | `LocalPlayer.state.proximity.distance` | written in `client/commands.lua:35-40`; initialized server-side | No | Preserve custom mode possibility. |
| Radio channel | `pma-voice` server/radio module | both current HUDs and radio device | `LocalPlayer.state.radioChannel` | server writes at `server/module/radio.lua:121-124` | No | `qbx_radio` is controller, not canonical store. |
| Health | GTA ped/Qbox persistence | native GTA components; `qbx_hud` | `GetEntityHealth(cache.ped) - 100` | native; metadata persisted by Qbox | Yes | UI needs live native value, not stale metadata. |
| Armor | GTA ped/Qbox persistence | native GTA component; `qbx_hud` | `GetPedArmour(cache.ped)` | native; metadata persisted by Qbox | Yes | Same cadence as health. |
| Hunger | `qbx_core` player state/metadata | `qbx_hud` | `LocalPlayer.state.hunger` plus change handler | state bag; core initializes at `server/player.lua:613` | No | Consumption setters in `qbx_smallresources/qbx_consumables/server.lua:16-31`. |
| Thirst | `qbx_core` player state/metadata | `qbx_hud` | `LocalPlayer.state.thirst` plus change handler | state bag; core initializes at `server/player.lua:614` | No | Same pattern as hunger. |
| Stress | Qbox state; modifiers in several resources | `qbx_hud` | `LocalPlayer.state.stress` plus change handler | state bag; core initializes at `server/player.lua:615` | No | `qbx_hud` stress generation is disabled (`config/shared.lua:3`) but compatibility events are used by medical/Jim resources. |
| Speed | GTA vehicle | `qbx_hud`, taxi/radar task UIs | `GetEntitySpeed(cache.vehicle)` converted once | native | Yes, vehicle only | Use mph/kph convar/config once. |
| RPM | GTA vehicle | none in current ambient HUD | `GetVehicleCurrentRpm(cache.vehicle)` | native | Yes, vehicle only | Top arc requires smoothing and clamping. |
| Gear | GTA vehicle | none in current ambient HUD | `GetVehicleCurrentGear(cache.vehicle)` plus reverse detection | native | Yes, vehicle only | Test CVT/electric/bicycle/aircraft cases. |
| Fuel | `ox_fuel` | `qbx_hud`, refuel UI | `Entity(vehicle).state.fuel`, fallback `GetVehicleFuelLevel` | entity state bag and native | Event/cache preferred; slow native fallback | `ox_fuel` writes at `client/fuel.lua:43-44`. |
| Seatbelt | unresolved `qbx_seatbelt`-style provider | `qbx_hud` | `LocalPlayer.state.seatbelt` | state bag expected | No | Provider absent from tree. Do not implement mechanics in HUD. |
| Harness | unresolved `qbx_seatbelt`-style provider/Jim item | `qbx_hud` | `LocalPlayer.state.harness` | state bag expected; export reference exists | No | Inventory item points to `jim-mechanic` at `[ox]/ox_inventory/data/items.lua:2587-2589`; resource also absent. |
| Cruise control | `qbx_smallresources/qbx_cruise` | `qbx_hud` | new absolute event/state, e.g. `bcrp-hud:client:setCruiseActive(bool)` | only toggle event currently | No after adapter | Existing local `cruiseOn` at `qbx_hud:client/main.lua:4,471-472`. |
| Engine health | GTA vehicle; mechanic systems may alter | `qbx_hud` | `GetVehicleEngineHealth(vehicle)` normalized 0-1000 | native | Yes, slow/vehicle tick | Current HUD divides by 10 at line 712. |
| Body health | GTA vehicle | no current ambient display found | `GetVehicleBodyHealth(vehicle)` | native | Yes, slow/vehicle tick | Use only if warning design needs it. |
| Vehicle class/type | GTA vehicle | conditional altitude/seatbelt in `qbx_hud` | `GetVehicleClass`, model natives, heli/plane/bicycle tests | native | On vehicle change only | Drive display policy, not gameplay. |
| Nitrous | external/legacy provider | `qbx_hud` | compatibility event with absolute level/active | `hud:client:UpdateNitrous` at `qbx_hud/client/main.lua:476` | No | No canonical nitrous owner found in this tree; validate. |
| Loaded/unloaded | `qbx_core` | controls `qbx_hud` | `LocalPlayer.state.isLoggedIn`; Qbox load/unload events | state/event | No | Hide reason `unloaded`. |
| Dead/last stand | Qbox/medical plus ped native | `qbx_hud`, medical | state/metadata and native | state/event/native | Low-rate validation | Decide whether HUD dims or hides; do not own death logic. |

## Duplicate UI findings

| Information shown | Resource A | Resource B | Resource C | Recommended canonical display |
|---|---|---|---|---|
| Voice range/talking | `qbx_hud` | `pma-voice` | — | `bcrp-hud`; disable only pma visuals |
| Radio channel/activity | `qbx_hud` | `pma-voice` | `qbx_radio` device | Ambient status in `bcrp-hud`; channel controls remain in radio device |
| Speed | `qbx_hud` | `qbx_taxijob` meter | `wk_wars2x` police radar | Player vehicle speed in `bcrp-hud`; keep job instruments |
| Fuel | `qbx_hud` | `ox_fuel` refuel interaction | vehicle/job menus | Ambient level in `bcrp-hud`; refuel transaction in `ox_fuel` |
| Health/armor | native GTA HUD | `qbx_hud` | medical task UI | Ambient status in `bcrp-hud`; retain medical UI; keep native components suppressed |
| Hunger/thirst/stress | `qbx_hud` | notifications from consumable/medical systems | — | Persistent state in `bcrp-hud`; transient notifications remain |
| Radar visibility | `qbx_hud` | spawn/properties/core | appearance/police camera | One reason-based visibility service in `bcrp-hud`; adapters request reasons |
| Account changes | `qbx_hud` | banking UI | Qbox notifications | Do not put banking interface in HUD; decide whether to retain a small transient money toast |
| Context prompts | `ox_lib` TextUI | `ox_target` | resource-specific DrawText | Keep task prompts outside HUD; migrate duplicates separately |

## Existing HUD and minimap analysis

`qbx_hud` starts with `DisplayRadar(false)` (`client/main.lua:28`). It can install square or circular minimap masks and positions at lines 261-337. It shows the radar on entering a non-bicycle vehicle (681), applies `isOutMapChecked` on exit (741), hides it in cinematic mode (925-939), and has incomplete vehicle-only show/hide events at 1038-1063.

Problems to avoid carrying forward:

- `qbx_hud:client:hideHud` hides only the vehicle NUI and only when `cache.vehicle` exists; it is not a general HUD visibility API.
- `showHud` similarly restores only vehicle UI/radar.
- `DisplayRadar` is also called by Qbox character flow (`[qbx]/qbx_core/client/character.lua:147,367`), spawn (`[qbx]/qbx_spawn/client/main.lua:27,221`), property selection (`[qbx]/qbx_properties/client/apartmentselect.lua:205,236`), appearance (`[standalone]/illenium-appearance/game/customization.lua:558,573`), and BCRP police cameras (`[bcrp]/qbx_police/client/camera.lua:77,152`).
- `qbx_hud` cinematic bars use a permanent `Wait(0)` loop even when bars are disabled (`client/main.lua:925-940`).
- Compass can run at `Wait(0)` depending on `isChangeCompassFPSChecked` (`client/main.lua:982-1035`).

`bcrp-hud` should own minimap positioning/framing and its desired radar state while active. It should not repeatedly fight external direct `DisplayRadar` calls every frame. Adapters should set visibility reasons, and the HUD should reconcile radar on reason changes, pause changes, vehicle transitions, and resource restart.

## Vehicle HUD analysis

Current `qbx_hud` vehicle NUI contains speed, cached fuel, seatbelt, altitude, and map-border flags (`client/main.lua:562-597,716-727`). Engine health and cruise are sent through the player HUD message instead (`526-558,684-715`). There is no RPM or gear read.

Recommended update tiers:

- 33-50 ms while driving: speed, RPM, gear, voice/talking animation if needed.
- 100-250 ms: health, armor, seatbelt, cruise, engine/body warning.
- state/event driven: fuel state-bag changes, radio activity/channel, hunger/thirst/stress.
- on vehicle change: class/model, supported cluster type, initial fuel/health, minimap policy.
- stopped/out of vehicle: no vehicle-native polling loop.

Keep engine/repair warning in its existing external location only if in-game validation reveals another clean display. Static review found `qbx_hud`'s engine percentage but no separate persistent repair warning overlay. Mechanic damage logic (`[qbx]/qbx_mechanicjob/client/damage-effects.lua`) owns effects, not an ambient warning UI.

## Voice/radio analysis

`pma-voice` is canonical:

- proximity is written to `LocalPlayer.state.proximity` in `[voice]/pma-voice/client/commands.lua:35-40`;
- channel is written to player state in `server/module/radio.lua:121-124`;
- radio transmit activity is exposed both as `pma-voice:radioActive` and `LocalPlayer.state.radioActive` in `client/module/radio.lua:209-251`;
- the bundled UI displays call, channel, range, talking, and radio activity in `voice-ui/src/App.vue:5-13`;
- UI enable and refresh convars are documented in `fxmanifest.lua:52,62`.

Adapter recommendation: listen for state-bag changes to proximity/channel/radioActive, and sample `NetworkIsPlayerTalking` at the ambient HUD cadence. Do not intercept voice keybinds, radio routing, volumes, submixes, or animations.

## Status HUD analysis

Qbox initializes `hunger`, `thirst`, and `stress` state bags from metadata at `[qbx]/qbx_core/server/player.lua:608-620`. It persists them back at lines 712-714 and 1055-1061. `qbx_smallresources` consumables changes hunger/thirst/stress in `qbx_consumables/server.lua:16-68`. These state bags are the correct normalized inputs.

`qbx_hud` duplicates Qbox bridge events and direct state-bag handlers (`client/main.lua:445-464`). A new HUD should prefer state bags and keep legacy events only as temporary compatibility shims.

Stress generation/effects in `qbx_hud` are currently effectively disabled by extreme thresholds and `enableStress = false` (`config/shared.lua:3`; `config/client.lua:6-9`). Nonetheless, do not silently discard `hud:client:UpdateStress`: `randol_prescriptions`, `randol_medical`, and `jim_bridge` still emit it. Their canonical writes should be verified before the compatibility shim is removed.

## Visibility-control design

Recommended public contract:

```lua
exports('SetHidden', function(reason, hidden) end)
exports('IsHidden', function() end)
exports('GetHiddenReasons', function() end)

TriggerEvent('bcrp-hud:client:setHidden', 'spawn', true)
TriggerEvent('bcrp-hud:client:setHidden', 'spawn', false)
```

Use a set/map of reasons, not a counter and not one boolean:

```text
manual, unloaded, spawn, character, appearance, phone, inventory,
pause, death, cutscene, cinematic, screenshot, camera, admin
```

Rules:

- `/hideui` adds `manual`; `/showui` removes only `manual`.
- Persist only the manual preference in client KVP. System reasons are session state.
- Pause-menu state is detected locally and must not overwrite manual preference.
- `onResourceStart` rebuilds state from KVP, `LocalPlayer.state.isLoggedIn`, pause/death state, and current vehicle.
- A reason owner must clear its own reason on close, resource stop, and failure paths.
- Radar is visible only when the HUD policy wants it and the hidden-reason set is empty.
- Provide a short-lived reason helper only if it returns a cancellation token; avoid timers that can unhide a newer request.
- Do not automatically hide ambient HUD for NPWD/inventory unless design testing shows obstruction. If desired, use `phone`/`inventory` reasons from their open-state bags/events rather than editing bundles.

## Recommended bcrp-hud scope

Own:

- framed native minimap and minimap positioning;
- thin ambient icon row;
- voice speaking, radio transmitting, proximity, and optional channel;
- health, armor, hunger, thirst, stress where design calls for them;
- vehicle cluster: RPM arc, fuel arc, speed, gear, seatbelt, cruise, and normalized engine/body warning;
- visibility arbitration, `/hideui`, `/showui`, and compatibility hide/show events;
- normalization, caching, throttling, and NUI diffing.

Do not own:

- voice/radio routing or controls;
- seatbelt/harness mechanics;
- cruise mechanics;
- fuel consumption/refueling/payment;
- stress generation or effects;
- vehicle damage/repair mechanics;
- NPWD, inventory, banking, MDT, dispatch, menus, dialogs, notifications, progress, TextUI, character/spawn, appearance, minigames, job instruments, or police radar.

## Suggested adapters

| Adapter | Inputs | Output to HUD | Failure behavior |
|---|---|---|---|
| `qbox_status` | `LocalPlayer.state` hunger/thirst/stress/isLoggedIn; Qbox death metadata | normalized 0-100 and loaded/dead | hide unavailable icon; never synthesize gameplay state |
| `pma_voice` | `proximity`, `radioChannel`, `radioActive` state; talking native | booleans/channel/range | show disconnected/neutral voice state |
| `ox_fuel` | entity `fuel` state, native fallback | 0-100 fuel | slow native fallback only |
| `seatbelt` | `LocalPlayer.state.seatbelt`, `.harness` | absolute booleans/value | hide indicator and log one warning if provider absent |
| `qbx_cruise` | new absolute active event/state | active boolean | false on vehicle exit/resource restart |
| `vehicle_native` | speed/RPM/gear/engine/body/class/model | normalized cluster packet | stop loop immediately on vehicle exit |
| `legacy_hud_events` | `hud:client:UpdateNeeds`, `UpdateStress`, `UpdateNitrous`, `UpdateHarness`, money events | compatibility updates | deprecate after producer audit/runtime validation |
| `visibility` | Qbox loaded events, pause/death, adapters from spawn/appearance/camera | reason set | fail hidden during character transitions |

## Start order and dependencies

Current group ordering in `server.cfg:78-110` starts `ox_lib`, `qbx_core`, `[ox]`, `[qbx]`, `[standalone]`, `[srp]`, `[bcrp]`, then `[voice]`, NPWD, and NPWD apps. Group-local order is not an adequate dependency declaration.

Recommended:

1. Keep explicit `ox_lib`, `qbx_core`, `ox_fuel`, `pma-voice`, and seatbelt provider starts before `bcrp-hud`, or declare soft adapters that tolerate late starts.
2. Declare hard dependencies only for systems required to render at all (`ox_lib`, likely `qbx_core`). Treat `pma-voice`, `ox_fuel`, and seatbelt as optional adapters if graceful degradation is desired.
3. Start `bcrp-hud` after its providers.
4. Disable/stop `qbx_hud` only in the final migration phase.
5. Keep `voice_enableUi 1` until the new voice adapter is verified, then change it to `0`.

## Performance risks

- `qbx_hud` player/vehicle loop runs every 50 ms by default (`client/main.lua:602-609`), polling ped, weapon, oxygen, voice, status, speed, engine, fuel cache, and pause state.
- Its compass loop may run every frame (`982-990`) and sends heading updates whenever rounded heading changes.
- Its cinematic loop runs every frame unconditionally (`925-940`).
- Stress shooting logic contains `Wait(0)` loops (`802-857`), although stress is disabled in current config.
- `qbx_smallresources` cruise runs every frame only while active (`qbx_cruise/client.lua:36-67`), which is justified for control mechanics and should not be duplicated.
- `ox_fuel` already has a 1-second driver loop (`client/init.lua:38-64`). Do not add a second fuel-consumption loop.
- `srp-vehiclecontrols` has two independent 500 ms vehicle loops (`client.lua:146-169,178-203`). They are not UI duplicates, but could later share a vehicle cache loop.
- Native HUD suppression in `qbx_hudcomponents` necessarily runs every frame. Keep a single owner for each suppressed component.

The new HUD should send one diffed NUI packet per visual frame at most, avoid JSON messages when values have not materially changed, smooth RPM client-side or in the NUI, and suspend vehicle sampling outside vehicles.

## Vendor update risks

Avoid edits in:

- `[qbx]/qbx_hud`, `qbx_core`, `qbx_smallresources`, `qbx_spawn`, and `qbx_properties`;
- `[voice]/pma-voice` and `qbx_radio`;
- `[ox]/ox_fuel`, `ox_lib`, `ox_inventory`, and `ox_target`;
- `Renewed-Banking`, `ps-mdt`, `ps-dispatch`, `illenium-appearance`, and NPWD.

Their manifests identify upstream repositories in several cases, and compiled bundles are especially overwrite-prone. Prefer convars, configs, events, state bags, and a BCRP-owned adapter resource. `qbx_police` lives under `[bcrp]` and is explicitly described in `server.cfg:91` as BCRP-owned; that is an appropriate direct adapter target after review.

## Unknowns requiring manual testing

1. Is a seatbelt resource injected elsewhere, escrowed, or missing? Check startup logs for `qbx_seatbelt` and inspect `LocalPlayer.state.seatbelt/harness` while driving.
2. Does `jim-mechanic` exist under a renamed resource? The harness inventory item targets it, but no manifest was found.
3. Which resource, if any, emits `hud:client:UpdateNitrous` at runtime?
4. Is `bcrp-playercount` persistent, command-only, or staff-only, and where does it appear relative to the minimap?
5. Does the `srp-rptools` fire-vest NUI remain on-screen during normal emergency play?
6. Are both production and example load screens actually started? `server.cfg` starts the `[standalone]` group, while the example lives under CFX test resources.
7. Are `runcode` and other CFX test resources started in production?
8. Do spawn, apartment selection, appearance, police cameras, binoculars, news camera, death/laststand, pause, and resource restart restore radar correctly today?
9. Confirm UI behavior for motorcycles, bicycles, boats, aircraft, trains, emergency vehicles, electric/CVT vehicles, reverse/neutral gear, stalled engines, and passenger seats.
10. Confirm aspect ratios, safe-zone sizes, ultrawide resolutions, and minimap mask streaming/replacement behavior.
11. Determine whether account-change popups and compass/street labels should be retained as separate BCRP modules or retired.

## Phased implementation plan

### Phase 0 — runtime evidence

- Resolve the seatbelt/harness and nitrous owners.
- Capture screenshots/video and resource-monitor timings for every persistent overlay.
- Exercise every visibility transition listed above.

### Phase 1 — state/visibility shell

- Create `bcrp-hud` with no gameplay mechanics.
- Implement reason-based visibility, KVP manual preference, load/restart handling, and adapter lifecycle.
- Add a diagnostic command that prints normalized state and hidden reasons.

### Phase 2 — player and voice HUD

- Add Qbox state-bag and `pma-voice` adapters.
- Match health/armor/status/voice behavior.
- Set `voice_enableUi 0` only after parity validation.

### Phase 3 — minimap and vehicle cluster

- Own minimap frame/position and radar policy.
- Add vehicle-native sampling, `ox_fuel`, seatbelt, and cruise adapters.
- Validate all vehicle classes and performance.

### Phase 4 — compatibility and transition

- Provide temporary handlers for required `hud:client:*` events.
- Adapt BCRP-owned visibility producers.
- Decide compass, street, money toast, nitrous, and engine-warning dispositions.

### Phase 5 — retirement

- Stop `qbx_hud` on the test branch.
- Re-run full spawn/death/appearance/phone/inventory/vehicle validation and profiler comparison.
- Remove compatibility shims only when no producers remain.

## Concise action list

### Safe config-only changes

- After voice parity: change `voice.cfg:37` from `setr voice_enableUi 1` to `0`.
- Keep `qbx_hud` stress disabled (`[qbx]/qbx_hud/config/shared.lua:3`) unless gameplay design explicitly re-enables it.
- Review `[qbx]/qbx_smallresources/qbx_hudcomponents/config.lua:2-10` so native HUD suppression matches the new HUD.
- Disable unused test/example resources through server configuration after validation.

### Custom resource changes

- Build `bcrp-hud` as the sole ambient HUD/minimap visual owner.
- Add reason-based visibility, KVP manual preference, restart recovery, and diagnostic state output.
- Add absolute cruise-state signaling in a BCRP-owned adapter; do not rely only on toggle events.
- Adapt BCRP-owned `qbx_police` camera transitions to visibility reasons.

### Adapter work

- Qbox status/load/death adapter.
- `pma-voice` proximity/channel/radio-active adapter.
- `ox_fuel` entity-state/native-fallback adapter.
- Seatbelt/harness adapter after owner discovery.
- Cruise adapter from `qbx_smallresources`.
- Temporary legacy `hud:client:*` compatibility adapter.

### Vendor edits to avoid

- Do not edit compiled NUI bundles.
- Do not move fuel, voice, cruise, seatbelt, stress, damage, or repair mechanics into `bcrp-hud`.
- Do not patch `qbx_hud` to become a half-disabled state service; replace it after extracting the few compatibility behaviors needed.
- Do not patch NPWD, inventory, banking, MDT, dispatch, appearance, or ox_lib UI to match the HUD.

### Resources requiring in-game validation

- Missing `qbx_seatbelt` / harness provider and absent `jim-mechanic`.
- `qbx_hud` retirement behavior and all legacy event producers.
- `pma-voice` UI disable and activity accuracy.
- `bcrp-playercount`, `srp-rptools` fire-vest, nitrous, and engine warning.
- Spawn, apartment, appearance, camera, death, pause, cinematic, screenshot, reconnect, and resource-restart visibility.
- Every supported vehicle class and display/aspect-ratio combination.
