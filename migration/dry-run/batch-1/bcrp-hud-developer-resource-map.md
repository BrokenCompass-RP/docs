---
title: BCRP HUD developer resource map
description: ''
default_visibility: developer
---
# BCRP HUD developer resource map

Baseline: `[bcrp]/bcrp-hud` Phase 1 fork of `[qbx]/qbx_hud` manifest
version `0.1.0`, copied from local Git commit
`0378a9e6049227ab187785f85a23117ace9e0adc`.

Line ranges describe the Phase 1 fork and must be refreshed after structural
edits.

## 1. Resource Tree

```text
bcrp-hud/
├── .github/
│   ├── actions/
│   │   └── bump-manifest-version.js
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── config.yml
│   │   └── feature_request.yml
│   ├── workflows/
│   │   ├── discord-commit.yml
│   │   ├── discord-release.yml
│   │   ├── issues-project.yml
│   │   ├── lint.yml
│   │   ├── release-action.yml
│   │   └── release.yml
│   ├── CODE_OF_CONDUCT.md
│   ├── contributing.md
│   └── pull_request_template.md
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── client/
│   └── main.lua
├── config/
│   ├── client.lua
│   ├── server.lua
│   └── shared.lua
├── html/
│   ├── app.js
│   ├── brand-logo.svg
│   ├── index.html
│   ├── responsive.css
│   └── styles.css
├── locales/
│   ├── ar.json
│   ├── cs.json
│   ├── da.json
│   ├── de.json
│   ├── en.json
│   ├── es.json
│   ├── et.json
│   ├── fa.json
│   ├── fi.json
│   ├── fr.json
│   ├── ge.json
│   ├── it.json
│   ├── nl.json
│   ├── pl.json
│   ├── pt-br.json
│   ├── pt.json
│   ├── sk.json
│   ├── sv.json
│   └── tr.json
├── server/
│   └── main.lua
├── stream/
│   ├── circlemap.ytd
│   ├── minimap.gfx
│   ├── minimap.ytd
│   └── squaremap.ytd
├── .editorconfig
├── .gitignore
├── fxmanifest.lua
└── README.md
```

There are 52 files including upstream hidden development metadata. There is
no frontend `src/`, `package.json`, lockfile, or bundler configuration.

## 2. File Responsibility Map

### Runtime code and configuration

| File | Purpose / major responsibilities | Dependencies and APIs | Registered / emitted interfaces | State, natives, persistence | High-risk notes |
|---|---|---|---|---|---|
| `fxmanifest.lua` | Resource identity, entries, NUI page, mounted files, Lua/OAL flags | `ox_lib`, `qbx_core` includes | Loads `client/main.lua`, `server/main.lua`, `html/index.html` | Mounts locale/config files; stream directory is streamed by FiveM | Do not rename mounted paths or remove upstream attribution casually |
| `client/main.lua` | Entire client HUD controller: settings, NUI, minimap, status/vehicle collection, money, stress, cinematic, compass, reason-based visibility | Qbox playerdata/lib, ox_lib, ox_inventory events, GTA/Mumble natives, seatbelt/voice/nitro state | Registers 27 NUI callbacks, `/hideui`, `/showui`, and public compatibility events; emits `hud:server:GainStress`; sends all NUI actions | Reads player/entity state bags; KVP `hudSettings` and `bcrpHudManualHidden`; extensive natives | Primary high-risk file; public event/message names are compatibility surface |
| `server/main.lua` | Inventory visibility forwarding, settings callback, stress mutation, cash/bank/dev commands | qbx_core, ox_lib, ox_inventory events | Registers `hud:server:GainStress`, `hud:server:RelieveStress`, `hud:server:getMenu`; emits legacy HUD client events | Reads Qbox player metadata/money | Inventory event source semantics and legacy event names must remain stable |
| `config/client.lua` | Menu key, MPH conversion, stress thresholds/effects, armed/stress weapon exclusions | Lua/FiveM hashes | None | No persistence itself | MPH label is separately hardcoded in CSS |
| `config/server.lua` | LEO stress exclusion | qbx_core job type | None | No persistence | Affects gameplay, not only visuals |
| `config/shared.lua` | Stress master switch and menu defaults | imported by client/server | None | Client mutates imported menu and persists it | Despite name, menu values become per-client mutable state |
| `README.md` | Fork ownership, baseline, operational warning, upstream feature documentation | Upstream project attribution | None | None | Keep baseline and simultaneous-start warning current |
| `docs/bcrp-hud-data-contract.md` | Current and normalized Lua-to-NUI contract, types, units, defaults, cadence, ownership, compatibility, and deferrals | `client/main.lua`, deployed frontend, installed providers | Documents version 1 fields on legacy actions | No runtime state | Normative Phase 3 reference; update with every contract change |

### Frontend

| File | Purpose / major responsibilities | Dependencies | Interfaces | High-risk notes |
|---|---|---|---|---|
| `html/index.html` | Declares settings, money, status, vehicle, compass/baseplate DOM and Vue/Quasar templates | CDN Quasar, Vue, jQuery, Google Fonts/Material Icons, Font Awesome Pro; local CSS/JS | Vue bindings consumed by `app.js` | IDs and mount roots are hard dependencies; CDN runtime dependency |
| `html/app.js` | Four Vue apps, settings localStorage, NUI listeners, NUI callback POSTs, visibility/color rules, compass DOM updates | Vue/Quasar globals, jQuery, `GetParentResourceName()` | Receives `open`, `hudtick`, `car`, money, `update`, `baseplate`; posts all settings callbacks | Message names and callback paths must remain stable; current file is source and deployed artifact |
| `html/styles.css` | Base/menu colors, HUD positioning, gauge labels, map borders, animations, compass styles | Quasar class names and HTML IDs | CSS generated labels include `MPH` and `ALT` | Coupled to Quasar markup and minimap offsets |
| `html/responsive.css` | Resolution-specific status/vehicle/compass overrides | Existing DOM IDs/classes | None | Repeats offsets for eight exact resolution blocks; fragile |
| `html/brand-logo.svg` | Settings-menu logo | HTML image reference | None | Visual asset only; preserve path until frontend redesign |

### Locale files

All locale files provide the same ox_lib key schema for settings, commands,
errors, map/cinematic notices, fuel, and stress. They have no events, NUI
messages, callbacks, state bags, natives, or KVP keys. `fxmanifest.lua` mounts
`locales/*.json`; ox_lib selects the active locale.

| File | Locale | File | Locale | File | Locale |
|---|---|---|---|---|---|
| `locales/ar.json` | Arabic | `locales/cs.json` | Czech | `locales/da.json` | Danish |
| `locales/de.json` | German | `locales/en.json` | English | `locales/es.json` | Spanish |
| `locales/et.json` | Estonian | `locales/fa.json` | Persian | `locales/fi.json` | Finnish |
| `locales/fr.json` | French | `locales/ge.json` | Georgian | `locales/it.json` | Italian |
| `locales/nl.json` | Dutch | `locales/pl.json` | Polish | `locales/pt-br.json` | Brazilian Portuguese |
| `locales/pt.json` | Portuguese | `locales/sk.json` | Slovak | `locales/sv.json` | Swedish |
| `locales/tr.json` | Turkish |  |  |  |  |

Do not casually rename locale keys: server/client calls use
`locale('...')`, and a missing key is a runtime-facing regression.
Static JSON parsing found that the copied upstream `locales/cs.json` is
invalid at line 20 (`notify` object). The fork is byte-identical to upstream
for this file, so Phase 1 did not repair it. Czech locale loading must remain
blocked/validation-required until a separately scoped correction is made.

### Streamed assets

| File | Responsibility | Consumer / dependency | High-risk notes |
|---|---|---|---|
| `stream/squaremap.ytd` | Square `radarmasksm` replacement texture dictionary | `client/main.lua:318,323-324` | Dictionary and texture names must match `AddReplaceTexture` |
| `stream/circlemap.ytd` | Circular `radarmasksm` replacement texture dictionary | `client/main.lua:352,357-358` | Same naming constraint |
| `stream/minimap.ytd` | Minimap texture assets | FiveM streaming/minimap scaleform | Binary; visual validation required |
| `stream/minimap.gfx` | Minimap scaleform asset | FiveM radar/minimap | Binary; replacement can break radar layout globally |

### Repository/development metadata

These files were copied to preserve the complete upstream resource. They are
not loaded by FiveM and have no runtime events, state, natives, NUI, or KVP.

| File | Responsibility |
|---|---|
| `.editorconfig` | Upstream editor formatting |
| `.gitignore` | Upstream ignore patterns |
| `.vscode/extensions.json` | Recommended VS Code extensions |
| `.vscode/settings.json` | Upstream workspace editor settings |
| `.github/actions/bump-manifest-version.js` | Upstream release helper that increments manifest version |
| `.github/CODE_OF_CONDUCT.md` | Upstream community policy |
| `.github/contributing.md` | Upstream contribution guidance |
| `.github/pull_request_template.md` | Upstream PR template |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Upstream bug form |
| `.github/ISSUE_TEMPLATE/config.yml` | Upstream issue-template configuration |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Upstream feature form |
| `.github/workflows/discord-commit.yml` | Upstream Discord commit workflow |
| `.github/workflows/discord-release.yml` | Upstream Discord release workflow |
| `.github/workflows/issues-project.yml` | Upstream issue-project automation |
| `.github/workflows/lint.yml` | Upstream lint workflow |
| `.github/workflows/release-action.yml` | Upstream release action |
| `.github/workflows/release.yml` | Upstream release workflow |

The copied release metadata still represents upstream automation and must not
be enabled in BCRP CI without a separate review.

## 3. `client/main.lua` Section Map

```text
client/main.lua
├── 1–74      Configuration, contract constants, visibility/radar state and helpers
├── 75–90     Cinematic bar state transition helper
├── 92–135    Settings hydration, KVP persistence, player/resource lifecycle
├── 137–198   Menu, reset/restart callbacks and events
├── 200–305   General/status/vehicle settings NUI callbacks
├── 307–414   Minimap shape, mask, position, border settings
├── 416–484   Engine/nitro/compass/cinematic settings callbacks
├── 487–548   Status, seatbelt, cruise, nitrous, harness, dev compatibility
├── 550–612   Player HUD diffing and versioned `hudtick` sender
├── 614–703   Vehicle HUD diffing, fuel cache, and cached class/type context
├── 705–889   Main player/vehicle collection and normalized contract loop
├── 892–908   Low-fuel notification loop
├── 910–939   Money/account events
├── 941–1002  Speeding/shooting stress gain
├── 1004–1058 Stress visual/ragdoll effects
├── 1060–1074 Cinematic bars and frame loop
├── 1075–1111 Compass/baseplate diffing and street cache
├── 1113–1177 Compass heading/visibility loop
└── 1179–1195 Inventory compatibility events and manual visibility commands
```

### Detailed client ownership

| Range | Key functions/events/state | Current dependencies | Planned future owner if split |
|---|---|---|---|
| 1–74 | Contract version/speed unit, status locals, `bcrpHudManualHidden`, visibility reasons, radar/NUI helpers | Qbox player state, config, KVP | state/lifecycle + contract constants |
| 75–90 | `cinematicShow`, `w` | bigmap natives | cinematic module or removal decision |
| 92–135 | `loadSettings`, `saveSettings`, `QBCore:Client:OnPlayerLoaded`, `onResourceStart`; KVP `hudSettings` | qbx playerdata, KVP, NUI | settings/lifecycle module |
| 137–198 | `settingsMenu`, `restartHud`; callbacks `closeMenu`, `restartHud`, `resetStorage`; event `hud:client:resetStorage` | NUI focus, qbx notify, server callback | settings bridge |
| 200–305 | callbacks through `HideMap`; event `hud:client:ToggleHealth` | shared menu table/KVP, visibility state | settings bridge |
| 307–414 | `hud:client:LoadMap`; `ToggleMapShape`, `ToggleMapBorders`; aspect ratio and texture replacement | ox_lib texture request, stream assets, minimap natives | minimap module |
| 416–484 | dynamic engine/nitro and compass callbacks; `cinematicMode` | NUI, qbx notify, visibility state | settings + cinematic |
| 487–548 | `ToggleAirHud`, state-bag handlers, deprecated needs/stress/nitro events, `ToggleCruise`, harness/dev events; entity `nitro*` handlers | Qbox state handlers, seatbelt/cruise/vehicle providers | compatibility adapters |
| 550–612 | weapon whitelist, `updatePlayerHud`, 36-field diff cache, legacy plus normalized `hudtick` | NUI | versioned player/voice contract |
| 614–703 | `updateVehicleHud`, 25-field diff cache, `getFuelLevel`, cached `getVehicleContext` | vehicle natives, NUI | versioned vehicle adapter/contract |
| 705–889 | main 50/500 ms loop; legacy payload bridge; RPM/gear/class/type/aircraft/altitude/voice/radio normalized reads | GTA/Mumble natives, pma/qbx state bags | player + vehicle contract sampler |
| 892–908 | low-fuel 10-second loop and notification | fuel native/qbx notify | vehicle alert policy |
| 910–939 | `ShowAccounts`, `OnMoneyChange`; NUI `show`, `updatemoney` | qbx player money | account compatibility |
| 941–1002 | stress gain threads, `ox_inventory:currentWeapon` | ox_inventory, server stress event | gameplay stress module or upstream compatibility |
| 1004–1058 | blur/ragdoll stress effects | GTA natives | gameplay stress module |
| 1060–1074 | `blackBars`, unconditional frame loop; NUI hiding is transition-owned | `DrawRect`, radar | cinematic/visibility |
| 1075–1111 | `updateBaseplateHud`, forced visibility refresh, `getCrossroads` | street natives, NUI | compass/street module |
| 1113–1177 | hidden-state native suppression, camera/ped heading, deduplicated baseplate visibility | camera/entity natives, visibility state, NUI | compass sampler |
| 1179–1195 | preserved `qbx_hud:client:showHud`/`hideHud`; `/hideui`, `/showui` | inventory forwarding, KVP, visibility state | compatibility + visibility |

### Phase 2C polling review

All polling loops were reviewed before implementation. Phase 2C does not change
any interval or `Wait(...)` expression.

| Loop | Existing interval / activation | Phase 2C decision |
|---|---|---|
| Main player/vehicle HUD | 50 ms synchronized or 500 ms optimized setting | Unchanged; duplicate native/state reads are cached within each iteration |
| Low-fuel warning | 10 seconds, plus 60 seconds after a warning | Unchanged; further fuel-cache consolidation deferred because rapid vehicle switches can expose stale values |
| Speeding stress | 10 seconds while stress feature is configured on | Unchanged |
| Shooting stress | Every frame while an eligible weapon thread is active | Unchanged; stress gating deferred for dedicated behavior validation |
| Stress screen effects | Dynamic configured interval, with effect-specific waits | Unchanged; gameplay behavior remains outside safe performance-only edits |
| Cinematic bars | Every frame | Unchanged; drawing/radar enforcement still requires frame behavior, but redundant NUI hides were removed |
| Compass | Every frame or 50 ms optimized setting | Unchanged; heading natives are skipped while hidden and on-foot baseplate visibility sends are transition-only |

One-shot waits used by settings callbacks, minimap refresh, cinematic
transitions, and HUD restart are not polling loops and are also unchanged.

## 4. `server/main.lua` Section Map

| Range | Responsibility | Interfaces and dependencies |
|---|---|---|
| 1–5 | Fork version-check policy and server config | Upstream automatic version check deliberately disabled; imports `config.server/shared` |
| 7–15 | Inventory visibility forwarding | Handles `ox_inventory:openedInventory` / `closedInventory`; emits preserved `qbx_hud:client:hideHud/showHud` |
| 17–21 | Settings callback | Registers `hud:server:getMenu` with ox_lib callback |
| 23–63 | Stress events | Registers `hud:server:GainStress` and `RelieveStress`; reads/writes qbx metadata; emits `hud:client:UpdateStress`; qbx notifications |
| 65–74 | Cash command | Localized ox_lib command; Qbox player money; emits `hud:client:ShowAccounts` |
| 76–82 | Bank command | Same for bank |
| 84–89 | Developer command | Restricted `dev`; emits `qb-admin:client:ToggleDevmode` |

## 5. Frontend Map

### `html/index.html`

| Range | Component |
|---|---|
| 1–13 | Head, CSS, external CDN dependencies, `app.js` |
| 15–53 | Compass/baseplate, street labels, compass SVG |
| 54–189 | Quasar settings menu |
| 191–206 | Money/account popup |
| 207–308 | Player/status HUD radials |
| 309–340 | Vehicle speed/fuel/altitude/seatbelt and minimap borders |
| 341–343 | Root closure |

### `html/app.js`

| Range | Component / logic |
|---|---|
| 1–144 | Settings Vue state, localStorage watches, two used progress slots |
| 145–417 | Settings defaults and menu methods |
| 418–428 | Settings hydration message listener and menu mount |
| 430–519 | Escape handling and frontend-to-Lua callback functions |
| 521–533 | `open` message listener/jQuery menu display |
| 538–615 | Money Vue app and active `updatemoney`/`show` handlers |
| 617–674 | Player HUD state declaration |
| 677–686 | Player `hudtick` message listener |
| 687–887 | Player dynamic visibility and threshold/color rules |
| 888–890 | Player app mount |
| 892–910 | Vehicle HUD state declaration |
| 913–921 | Vehicle `car` listener |
| 923–971 | Vehicle state, fuel/seatbelt colors and visibility rules |
| 973–975 | Vehicle app mount |
| 977–989 | Compass/baseplate state |
| 991–1009 | `update` and `baseplate` listeners; SVG viewBox updates |
| 1011–1041 | Baseplate visibility/state method |
| 1043–1045 | Compass app mount |

### CSS

| File/range | Responsibility |
|---|---|
| `styles.css:4–37` | Menu and Quasar overrides |
| `styles.css:40–55` | Radial colors and main container |
| `styles.css:57–95` | Money layout |
| `styles.css:96–108` | Player HUD layout |
| `styles.css:109–175` | Vehicle labels, map border shapes |
| `styles.css:176–200` | Transitions |
| `styles.css:201–294` | Compass/baseplate/street layout |
| `responsive.css:1–4` | Shared responsive base |
| `responsive.css:5–50` | Generic minimum-width layout |
| `responsive.css:51–97` | 3840×2160 |
| `responsive.css:98–144` | 3440×1440 |
| `responsive.css:145–190` | 2560×1440 |
| `responsive.css:191–236` | 1920×1440 |
| `responsive.css:237–282` | 1920×1200 |
| `responsive.css:283–328` | 1920×1080 |
| `responsive.css:329–373` | 1280×720 |

## 6. Runtime Data Flow

```text
qbx_core player data/state ───────────────┐
GTA ped/vehicle/camera/street natives ────┤
pma-voice LocalPlayer state ──────────────┤
ox_fuel native/entity fuel ownership ─────┤
qbx_seatbelt LocalPlayer state ───────────┤
qbx_smallresources/qbx_cruise event ──────┤
                                          ▼
                              client/main.lua
                         cache, normalize, diff state
                                          ▼
                                 SendNUIMessage
                                          ▼
                                  html/app.js
                      window message listeners / Vue state
                                          ▼
                               html/index.html
                     Vue/Quasar components and compass SVG
```

### Current NUI actions

| Action / selector | Lua sender | Payload | Frontend receiver |
|---|---|---|---|
| no action; `event`/`toggle` | `client/main.lua:96-108` | `test`, setting key/value | `app.js:418-423` |
| `open` | `client/main.lua:141` | action only | `app.js:521-533` |
| `hudtick` | `client/main.lua:63,169-170,573-611` | legacy player/status plus version 1 voice/radio/harness fields | `app.js:677-887` |
| `car` | `client/main.lua:64,165-166,625-654,878-883` | legacy vehicle fields plus version 1 RPM/gear/class/type/aircraft/normalized values | `app.js:913-971` |
| `show` | `client/main.lua:914-925` | type and cash/bank | `app.js:562-563,603-612` |
| `updatemoney` | `client/main.lua:931-938` | balances, delta, direction, type | `app.js:559-560,569-602` |
| `update` | `client/main.lua:1141-1144,1157-1160` | heading | `app.js:996-1005` |
| `baseplate` | `client/main.lua:65,1086-1095,1164-1169` | streets and visibility flags | `app.js:1006-1041` |

The dead `showconstant` handler and its sole method were removed in Phase 2A
after repository-wide inspection found no sender. Active NUI action names are
unchanged.

The field-by-field legacy inventory and version 1 additions are normative in
`docs/bcrp-hud-data-contract.md`. The deployed frontend consumes all legacy
fields and ignores the appended normalized fields.

### Current frontend-to-Lua callbacks

| Group | Callback names | Lua ranges |
|---|---|---|
| Menu lifecycle | `closeMenu`, `restartHud`, `resetStorage` | 107–152 |
| General settings | `showOutMap`, `showOutCompass`, `showFollowCompass`, `showMapNotif`, `showFuelAlert`, `showCinematicNotif` | 154–195 |
| Dynamic status | `dynamicHealth`, `dynamicArmor`, `dynamicHunger`, `dynamicThirst`, `dynamicStress`, `dynamicOxygen` | 198–243 |
| Vehicle/minimap | `changeFPS`, `HideMap`, `ToggleMapShape`, `ToggleMapBorders`, `dynamicEngine`, `dynamicNitro` | 246–381 |
| Compass/cinematic | `showCompassBase`, `showStreetsNames`, `showPointerIndex`, `showDegreesNum`, `changeCompassFPS`, `cinematicMode` | 385–438 |

Every frontend POST uses
`https://${GetParentResourceName()}/<callback>` at `app.js:438-518`, so the
fork automatically targets `bcrp-hud`; there is no hardcoded NUI resource
URL to rename.

## 7. External Integration Map

| Provider | Exact path / API | Data or behavior consumed by fork | Modification required? |
|---|---|---|---|
| `qbx_core` | `[qbx]/qbx_core`; manifest includes `@qbx_core/modules/lib.lua` and `playerdata.lua`; `QBX.PlayerData`; `exports.qbx_core:GetPlayer/Notify`; `qbx.entityStateHandler` | player lifecycle/data, money, notifications, state helpers, commands | No |
| `ox_lib` | `[ox]/ox_lib`; `@ox_lib/init.lua`; locale, keybind, callback, texture request | locale, client keybind, callbacks, streamed texture loading, commands | No |
| `ox_inventory` | `[ox]/ox_inventory`; server `openedInventory/closedInventory`; client `currentWeapon` | legacy HUD hiding and shooting-stress weapon lifecycle | No for Phase 1 |
| `ox_fuel` | `[ox]/ox_fuel/client/fuel.lua:10-45`; vehicle native plus `Entity(vehicle).state.fuel` | Fork currently reads `GetVehicleFuelLevel` rather than entity state | No for Phase 1 |
| `pma-voice` | `[voice]/pma-voice/client/commands.lua:35-40`; `server/module/radio.lua:121-124`; `client/module/radio.lua:209-251` | `LocalPlayer.state.proximity.distance`, `radioChannel`, and reliable replicated `radioActive` transmit state | No; Phase 3 reads supported state only |
| `qbx_seatbelt` | `[qbx]/qbx_seatbelt/fxmanifest.lua`; APIs below | seatbelt/harness booleans and harness mechanics | No |
| `qbx_cruise` | `[qbx]/qbx_smallresources/qbx_cruise/client.lua:27-83`; event `seatbelt:client:ToggleCruise` | fork mirrors cruise with local toggle at `client/main.lua:518-520`; no canonical absolute state/export exists | No; normalized cruise remains deferred |

### Restored `qbx_seatbelt`

- Manifest: `[qbx]/qbx_seatbelt/fxmanifest.lua`
- Version/repository: `1.0.0`,
  `https://github.com/Qbox-project/qbx_seatbelt` (`:4-6`)
- Dependencies: ox_lib init, qbx_core client lib, qbx_core/ox_inventory
  server exports
- State written:
  - `LocalPlayer.state.seatbelt` at `client/main.lua:26-27,58`
  - `LocalPlayer.state.harness` at `client/main.lua:34-35,59`
- Export:
  - deprecated `HasHarness` at `client/main.lua:62-68`
- Events:
  - emits `seatbelt:client:ToggleSeatbelt` at `client/main.lua:29,36`
  - registers `qbx_seatbelt:client:UseHarness` at `:81`
  - emits/registers `qbx_seatbelt:server:equip` at client `:105` and server
    `main.lua:7`
- Harness handling:
  - prevents ordinary seatbelt toggling while harnessed;
  - changes windscreen-ejection parameters;
  - uses an ox_lib progress circle;
  - removes or updates harness durability through `ox_inventory`.
- Cruise interaction: none directly. Cruise is owned by
  `qbx_smallresources/qbx_cruise`; the HUD consumes its legacy toggle event.
- UI produced: no NUI, DrawText, or persistent HUD. It produces qbx
  notifications, an ox_lib progress circle, and buckle/unbuckle audio.
- Compatibility conclusion: `bcrp-hud` can consume the existing
  `LocalPlayer.state.seatbelt` and `.harness` values without modifying
  `qbx_seatbelt`.

### Visibility and radar callers

Phase 2B repository inspection found these current owners. Only callers inside
`bcrp-hud` were changed.

| Owner | Caller / condition | Current responsibility |
|---|---|---|
| `bcrp-hud/client/main.lua` | Initial resource state | Starts with `DisplayRadar(false)` |
| `bcrp-hud/client/main.lua` | Main loop | Applies `loggedOut` and `pause` reasons; sends player/vehicle visibility and enforces hidden radar state without changing loop cadence |
| `bcrp-hud/client/main.lua` | `qbx_hud:client:hideHud` / `showHud` | Preserved inventory-facing events now add/remove only the `inventory` reason |
| `bcrp-hud/client/main.lua` | `/hideui` / `/showui` | Adds/removes only the persistent `manual` reason |
| `bcrp-hud/client/main.lua` | Cinematic setting and frame loop | Adds/removes the `cinematic` reason; existing black-bar drawing and frame cadence are unchanged |
| `bcrp-hud/client/main.lua` | `HideMap`, vehicle transitions, out-of-vehicle map setting | Resolves radar from active hide reasons plus existing map preferences |
| `bcrp-hud/client/main.lua` | Compass loop | Resolves baseplate visibility from the same reasons and forces one update when hidden state changes |
| `bcrp-hud/server/main.lua` | `ox_inventory:openedInventory` / `closedInventory` | Forwards the preserved compatibility hide/show events |
| `qbx_spawn/client/main.lua` | Spawn/selection entry and completion | Direct `DisplayRadar(false/true)` and native HUD-component suppression; unchanged |
| `qbx_core/client/character.lua` | Character load/unload | Direct `DisplayRadar(true/false)`; unchanged |
| `qbx_properties/client/apartmentselect.lua` | Apartment selection transitions | Direct `DisplayRadar(true/false)` and native HUD-component suppression; unchanged |
| `illenium-appearance/game/customization.lua` | Appearance UI open/close when configured | Direct `DisplayRadar(false/true)`; unchanged |
| `bcrp/qbx_police/client/camera.lua` | Police camera transitions | Direct `DisplayRadar(true/false)`; unchanged |
| Binoculars, police heli, news camera, `qbx_hudcomponents` | Active camera/gameplay loops | Native `HideHudComponentThisFrame`; these do not control the NUI HUD and remain unchanged |

Death and laststand are display data (`playerDead`), not visibility owners, so
their existing behavior is unchanged. External spawn, appearance, and camera
resources do not expose ownership events to this HUD; integration with a future
public reason API remains HUD-045 Phase 5 work.

## 8. High-Risk Change Zones

| Zone | Exact locations | Risk / invariant |
|---|---|---|
| Minimap masks/assets | `client/main.lua:307-386`; `stream/*` | Texture dictionary/name, clip type, component offsets, bigmap refresh, and binary assets must stay synchronized |
| Aspect calculation | `client/main.lua:309-316` | Only active resolution/aspect offset is considered; safe-zone behavior requires runtime testing |
| KVP | `client/main.lua:29-36,92-135,193-198,1187-1195` | Preserve settings key `hudSettings`; Phase 2B stores only manual visibility in separate resource-scoped key `bcrpHudManualHidden` |
| Browser localStorage | `html/app.js:71-337` | Settings are also held in NUI storage; reset/hydration behavior is coupled |
| Event compatibility | client `487-548,910-939,1179-1195`; server `10-89` | External resources use legacy `hud:*`, `seatbelt:*`, `qb-admin:*`, and `qbx_hud:*` names |
| State assumptions | client `10-13,497-511,730-768,866` | Qbox/pma/seatbelt state may be nil during load or provider restart |
| Inventory visibility | server `10-16`; client `1179-1185` | Public event names remain stable; Phase 2B maps them to the transient `inventory` reason |
| Normalized contract | client `563-703,705-889`; `docs/bcrp-hud-data-contract.md` | Field names, types, units, defaults, cadence, and legacy bridges must change together |
| Stress gameplay | client `941-1058`; server `24-63`; configs | Includes metadata mutation, blur, ragdoll, and per-frame weapon work; not merely visual |
| NUI message names | Lua senders and `app.js` listeners mapped above | Renaming breaks silently unless both sides and external senders are reviewed |
| NUI callback URL | `html/app.js:438-518` | Must retain `GetParentResourceName()` so the fork targets itself |
| CDN dependencies | `html/index.html:6-11` | HUD currently needs external Vue, Quasar, fonts/icons, and jQuery; no lockfile/build |
| Server start order | `server.cfg:78-108` | Providers must precede fork; upstream and fork must never remain active together |
| Fork identity | `fxmanifest.lua:4-11`, `README.md:3-18`, `server/main.lua:1-2` | Do not restore upstream version checking or misidentify BCRP ownership |

### Phase 1 start sequence

The controlled test-branch sequence is:

```text
ensure ox_lib
ensure qbx_core
ensure [ox]
ensure [qbx]        # starts qbx_seatbelt and qbx_smallresources
stop qbx_hud        # upstream files retained, runtime stopped
ensure [voice]      # pma-voice before fork
ensure [bcrp]       # starts bcrp-hud
```

This is reversible by removing the `stop qbx_hud` line, restoring `[voice]`
to its former position if desired, and preventing `bcrp-hud` from starting.
Do not perform that rollback while `[bcrp]` still starts the fork.
