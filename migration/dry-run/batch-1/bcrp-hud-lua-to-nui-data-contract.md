---
title: BCRP HUD Lua-to-NUI data contract
description: ''
default_visibility: developer
---
# BCRP HUD Lua-to-NUI data contract

This document records the Phase 3 audit and the proposed backward-compatible
contract for `[bcrp]/bcrp-hud`. It describes the deployed hand-written
`html/app.js`; there is no package manifest, source/build split, or reproducible
frontend build. Phase 3 therefore extends Lua payloads only. The existing
frontend ignores unknown fields and requires no generated-asset edit.

## 1. Contract conventions

- `contractVersion` is the integer `1` on normalized full-state payloads.
- Lua booleans must arrive in JavaScript as booleans, not `0`/`1`.
- Percent fields use `0..100`; normalized ratios use `0.0..1.0`.
- Speed is an integer display value accompanied by `speedUnit`.
- Aircraft altitude is an integer in feet above the GTA world datum and is
  accompanied by `altitudeUnit = "ft"`.
- Missing/on-foot/unsupported normalized vehicle state defaults to the values
  in the proposed contract table. A `car` message with `show = false` remains
  the legacy hide signal and may omit full-state fields.
- Existing field names and semantics are retained as the compatibility bridge.
  New code must not infer normalized meaning from legacy sentinels such as
  `engine = -1`, `nos = -1`, or `parachute = -1`.
- Full-state payloads are diffed and sent only when at least one owned value
  changes. No polling interval is changed in Phase 3.

## 2. Current action inventory

| Action / selector | Lua owner and cadence | Frontend handler | Purpose |
|---|---|---|---|
| no `action`; `test/event/toggle` | `loadSettings`, player/resource hydration | global message listener and settings app | Hydrates a setting; `toggle` is boolean except FPS text |
| `open` | settings keybind, event-driven | settings app | Opens the settings menu |
| `hudtick` | main 50/500 ms diff loop; visibility/restart transitions | `playerHud.hudTick` | Player/status/voice and legacy vehicle-warning state |
| `car` | main 50/500 ms vehicle diff loop; visibility/restart/exit transitions | `vehHud.vehicleHud` | Vehicle gauges and visibility |
| `show` | `hud:client:ShowAccounts`, event-driven | money app | Shows cash or bank balance |
| `updatemoney` | `hud:client:OnMoneyChange`, event-driven | money app | Updates balance and delta popup |
| `update` | compass 0/50 ms loop when rounded heading changes | compass app | Heading |
| `baseplate` | compass loop/visibility transitions; streets cached 1500 ms | compass app | Compass/street visibility and names |

## 3. Current payload fields

### Settings hydration and `open`

| Field | Lua / JS type | Unit/range/default | Source and state model | Consumed |
|---|---|---|---|---|
| `test` | boolean / boolean | `true` | Settings hydration selector; transient | Yes |
| `event` | string / string | menu key | `hudSettings`; absolute setting name | Yes |
| `toggle` | boolean or string / same | boolean, or `Optimized`/`Synced` for FPS | Current menu value; absolute except display text | Yes |
| `action` | string / string | `open` | Settings keybind; transient command | Yes |

### `hudtick`

| Field | Lua / JS type | Unit/range/default | Source; cadence; model | Consumed by current frontend |
|---|---|---|---|---|
| `show` | boolean / boolean | `false` while hidden/logged out | Visibility reasons; 50/500 ms diff; absolute | Yes |
| `dynamicHealth` | boolean / boolean | menu default | `hudSettings`; 50/500 ms diff; absolute | Yes |
| `dynamicArmor` | boolean / boolean | menu default | Same | Yes |
| `dynamicHunger` | boolean / boolean | menu default | Same | Yes |
| `dynamicThirst` | boolean / boolean | menu default | Same | Yes |
| `dynamicStress` | boolean / boolean | menu default | Same | Yes |
| `dynamicOxygen` | boolean / boolean | menu default | Same | Yes |
| `dynamicEngine` | boolean / boolean | menu default | Same | Yes |
| `dynamicNitro` | boolean / boolean | menu default | Same | Yes |
| `health` | number / number | nominal percent `0..100` | `GetEntityHealth(ped)-100`; 50/500 ms; absolute | Yes |
| `playerDead` | boolean / boolean | `false` | death/laststand metadata and native; 50/500 ms; absolute | Yes |
| `armor` | number / number | percent `0..100` | `GetPedArmour`; 50/500 ms; absolute | Yes |
| `thirst` | number / number | percent, nominal `0..100` | Qbox state bag; on change sampled at 50/500 ms; absolute | Yes |
| `hunger` | number / number | percent, nominal `0..100` | Qbox state bag; same | Yes |
| `stress` | number / number | metadata units, nominal `0..100` | Qbox state bag; same | Yes |
| `voice` | number / number | meters, default `0` | pma-voice `proximity.distance`; 50/500 ms; absolute | Yes |
| `radio` | number / number | channel, `0` means none | pma-voice `radioChannel`; 50/500 ms; absolute | Yes |
| `talking` | boolean / boolean | `false` | `NetworkIsPlayerTalking`; 50/500 ms; absolute | Yes |
| `armed` | boolean / boolean | `false` | selected-weapon policy; 50/500 ms; absolute | Yes |
| `oxygen` | number / number | mixed legacy gauge units | Sprint expenditure on land or underwater time ×10; 50/500 ms; absolute but overloaded | Yes |
| `parachute` | number / number | native enum, `-1` unavailable | `GetPedParachuteState`; 50/500 ms; absolute with sentinel | Yes |
| `nos` | number / number | provider units, `-1` unavailable | nitro entity state/legacy event; 50/500 ms; absolute with sentinel | Yes |
| `cruise` | boolean / boolean | `false` | Local mirror of `seatbelt:client:ToggleCruise`; toggle-derived, not canonical absolute state | Yes |
| `nitroActive` | boolean or number / same | starts `0`, later provider boolean | nitro state/legacy event; 50/500 ms; conflicting legacy type | Yes |
| `harness` | boolean or nil / boolean or undefined | false/nil unsupported | `LocalPlayer.state.harness`; 50/500 ms; absolute | Yes |
| `hp` | number / number | harness provider units | player metadata/legacy event; 50/500 ms; absolute | Yes |
| `speed` | number / number | rounded MPH or km/h | vehicle speed native and client configuration; 50/500 ms; absolute, unit implicit | Yes |
| `engine` | number / number | legacy percent-like value; `-1` unavailable | engine health ÷10 in vehicle; 50/500 ms; absolute with sentinel | Yes |
| `cinematic` | boolean / boolean | `false` | menu/KVP; 50/500 ms; absolute | Yes |
| `dev` | boolean / boolean | `false` | admin toggle event; 50/500 ms; toggle-derived | Yes |

### `car`

| Field | Lua / JS type | Unit/range/default | Source; cadence; model | Consumed |
|---|---|---|---|---|
| `show` | boolean / boolean | `false` outside supported vehicle/hidden | Visibility and vehicle eligibility; 50/500 ms diff; absolute | Yes |
| `isPaused` | boolean / boolean | `false` | pause native; 50/500 ms; absolute | Yes |
| `seatbelt` | boolean or nil / boolean or undefined | false/nil unsupported | `LocalPlayer.state.seatbelt`; 50/500 ms; absolute | Yes |
| `speed` | number / number | rounded MPH or km/h | vehicle native; 50/500 ms; absolute, unit implicit | Yes |
| `fuel` | number / number | floored percent, nominal `0..100` | fuel native cached for 2 seconds; 50/500 ms payload; absolute | Yes |
| `altitude` | number / number | legacy world Z ×0.5, unit implicit | entity coordinates; 50/500 ms; absolute | Yes |
| `showAltitude` | boolean / boolean | `false` | aircraft/toggle policy; 50/500 ms; absolute display policy | Yes |
| `showSeatbelt` | boolean / boolean | `true` for supported road vehicles | aircraft/toggle policy; 50/500 ms; absolute display policy | Yes |
| `showSquareB` | boolean / boolean | `false` | minimap border setting; 50/500 ms; absolute | Yes |
| `showCircleB` | boolean / boolean | `false` | minimap border setting; 50/500 ms; absolute | Yes |

### Money and compass actions

| Action.field | Lua / JS type | Unit/range/default | Source and model | Consumed |
|---|---|---|---|---|
| `show.type` | string / string | `cash` or `bank` | Event argument; transient popup selector | Yes |
| `show.cash` / `show.bank` | number / number | account currency | Event argument; absolute balance | Yes |
| `updatemoney.cash` / `.bank` | number / number | account currency | `QBX.PlayerData.money`; absolute | Yes |
| `updatemoney.amount` | number / number | account currency | Event delta; transient | Yes |
| `updatemoney.minus` | boolean / boolean | `false` | Event direction; transient | Yes |
| `updatemoney.type` | string / string | account name | Event selector | Yes |
| `update.value` | number / number | degrees `0..359` | Camera/ped heading; rounded, change-driven | Yes |
| `baseplate.show` | boolean / boolean | `false` | Visibility/compass policy; absolute | Yes |
| `baseplate.street1` / `.street2` | string or nil / string or undefined | empty/undefined if unavailable | Street natives, cached 1500 ms; absolute | Yes |
| `baseplate.showCompass` | boolean or nil / boolean or undefined | setting/default | Menu policy; absolute | Yes |
| `baseplate.showStreets` | boolean or nil / boolean or undefined | setting/default | Menu policy; absolute | Yes |
| `baseplate.showPointer` | boolean or nil / boolean or undefined | setting/default | Menu policy; absolute | Yes |
| `baseplate.showDegrees` | boolean or nil / boolean or undefined | setting/default | Menu policy; absolute | Yes |

## 4. Frontend-to-Lua callbacks

All callbacks are event-like requests with no request payload currently used;
each responds with `cb("ok")`.

`closeMenu`, `restartHud`, `resetStorage`, `showOutMap`, `showOutCompass`,
`showFollowCompass`, `showMapNotif`, `showFuelAlert`,
`showCinematicNotif`, `dynamicHealth`, `dynamicArmor`, `dynamicHunger`,
`dynamicThirst`, `dynamicStress`, `dynamicOxygen`, `changeFPS`, `HideMap`,
`ToggleMapShape`, `ToggleMapBorders`, `dynamicEngine`, `dynamicNitro`,
`showCompassBase`, `showStreetsNames`, `showPointerIndex`, `showDegreesNum`,
`changeCompassFPS`, and `cinematicMode`.

The names, capitalization, callback behavior, and
`GetParentResourceName()` routing are compatibility surfaces.

## 5. Public Lua interfaces

Client events:

`QBCore:Client:OnPlayerLoaded`, `hud:client:resetStorage`,
`hud:client:ToggleHealth`, `hud:client:LoadMap`,
`hud:client:ToggleAirHud`, `hud:client:UpdateNeeds`,
`hud:client:UpdateStress`, `hud:client:ToggleShowSeatbelt`,
`seatbelt:client:ToggleCruise`, `hud:client:UpdateNitrous`,
`hud:client:UpdateHarness`, `qb-admin:client:ToggleDevmode`,
`hud:client:ShowAccounts`, `hud:client:OnMoneyChange`,
`qbx_hud:client:showHud`, and `qbx_hud:client:hideHud`.

Server events: `hud:server:GainStress`, `hud:server:RelieveStress`.

Commands: `/resethud`, `/hideui`, `/showui`. The resource declares no public
exports.

## 6. Polling/data ownership

| Loop | Cadence | Owned HUD data |
|---|---|---|
| Main HUD | 50 or 500 ms setting | visibility, player vitals, voice, radio channel, talking, vehicle speed/fuel/altitude/seatbelt, engine and nitro |
| Low fuel | 10 seconds; 60 seconds after warning | notification only; shares 2-second fuel cache |
| Speeding stress | 10 seconds when stress enabled | server stress gain, not NUI |
| Shooting stress | frame while eligible weapon is active | server stress gain, not NUI |
| Stress effects | configured interval | gameplay effects, not NUI |
| Cinematic | frame | black bars and radar enforcement, not contract data |
| Compass | frame or 50 ms setting | heading and baseplate/street data |

State ownership:

- Player needs/stress: Qbox player state bags.
- Health/armor/death/parachute: GTA natives plus Qbox death metadata.
- Voice proximity/radio channel/radio transmission: installed pma-voice state
  bags (`proximity`, `radioChannel`, `radioActive`) and talking native.
- Seatbelt/harness: restored `qbx_seatbelt` player state bags.
- Fuel: GTA fuel native as currently consumed by `bcrp-hud`/ox_fuel.
- Cruise: `qbx_smallresources/qbx_cruise` emits only a toggle event. It exposes
  no state bag, getter, or export, so `cruise` is only a legacy local mirror.
- Nitro: entity state handlers and preserved legacy events.
- Visibility: Phase 2B internal reasons plus existing settings.

## 7. Proposed normalized additions

These fields are added to existing full `hudtick` and `car` messages. The
deployed frontend ignores them, while every legacy field remains present.

### `hudtick` additions

| Field | Lua / JS type | Unit/range/default | Owner | Model | Current frontend |
|---|---|---|---|---|---|
| `contractVersion` | integer / number | `1` | bcrp-hud | absolute schema version | Ignored |
| `voiceRange` | number / number | meters, `0` unavailable | pma-voice proximity | absolute | Ignored |
| `voiceTalking` | boolean / boolean | `false` | talking native | absolute | Ignored |
| `radioChannel` | number / number | channel, `0` none | pma-voice state | absolute | Ignored |
| `radioTransmitting` | boolean / boolean | `false` | pma-voice `radioActive` | absolute | Ignored |
| `harnessActive` | boolean / boolean | `false` | qbx_seatbelt state | absolute | Ignored |

### `car` additions

| Field | Lua / JS type | Unit/range/default | Owner/source | Model | Current frontend |
|---|---|---|---|---|---|
| `contractVersion` | integer / number | `1` | bcrp-hud | absolute schema version | Ignored |
| `speedValue` | integer / number | `>=0`, default `0` | rounded existing speed sample | absolute | Ignored |
| `speedUnit` | string / string | `mph` or `kmh` | client configuration | absolute | Ignored |
| `rpm` | number / number | normalized `0.0..1.0`, default `0` | `GetVehicleCurrentRpm` | absolute | Ignored |
| `gear` | integer / number | native gear `0..n`, default `0` | `GetVehicleCurrentGear` | absolute; native `0` can represent reverse/neutral | Ignored |
| `gearState` | string / string | `drive` or `reverse_or_neutral` | derived from native gear | absolute with documented native ambiguity | Ignored |
| `vehicleClass` | integer / number | GTA class `0..22`, `-1` unsupported | cached `GetVehicleClass` | absolute per vehicle | Ignored |
| `vehicleType` | string / string | `road`, `motorcycle`, `bicycle`, `boat`, `helicopter`, `plane`, `train`, `other`, `none` | Lua class mapping | absolute per vehicle | Ignored |
| `isAircraft` | boolean / boolean | `false` | normalized type | absolute per vehicle | Ignored |
| `altitudeValue` | integer / number | feet above world datum; default `0` | entity world Z ×3.28084 | absolute | Ignored |
| `altitudeUnit` | string / string | `ft` | bcrp-hud | absolute | Ignored |
| `seatbeltActive` | boolean / boolean | `false` | qbx_seatbelt state | absolute | Ignored |
| `harnessActive` | boolean / boolean | `false` | qbx_seatbelt state | absolute | Ignored |
| `engineHealthPercent` | number / number | clamped `0..100`, default `0` | existing engine-health native ÷10 | absolute | Ignored |
| `fuelPercent` | integer / number | clamped `0..100`, default `0` | existing cached fuel sample | absolute | Ignored |

Normalized vehicle full-state fields are currently emitted only when the
existing legacy `car` eligibility check passes. Phase 3 does not change that
check or alter whether the current frontend appears for any class. A future
frontend/eligibility migration must explicitly validate bicycles before using
the adaptive cluster there.

## 8. Defaults and unsupported states

| State | Normalized behavior |
|---|---|
| Logged out | visibility messages hide the HUD; no fabricated player/vehicle full state |
| On foot | `car.show=false`; conceptual vehicle defaults are type `none`, class `-1`, numeric `0`, booleans `false` |
| Vehicle rejected by legacy eligibility | no normalized full `car` state; existing hide behavior is preserved |
| Missing pma proximity | `voiceRange=0` |
| No radio channel | `radioChannel=0` |
| Not transmitting | `radioTransmitting=false` |
| No belt/harness | normalized booleans are `false` |
| Engine/fuel unavailable | normalized percent defaults are `0`; legacy fields retain their current behavior |

## 9. Backward compatibility

- Existing NUI action names are unchanged.
- Existing `hudtick` and `car` fields are unchanged in name, type, unit, and
  update cadence.
- Normalized fields are appended to the existing diff payload arrays so their
  state changes can trigger an update without a second NUI message.
- The current frontend continues to consume only legacy fields.
- Existing public events, callbacks, commands, exports, KVP keys, polling
  intervals, settings, and visibility behavior are unchanged.
- Legacy `cruise`, overloaded oxygen/nitro values, and sentinel fields remain
  compatibility-only and are not promoted as normalized state.

## 10. Deferred fields

| Field/decision | Reason |
|---|---|
| Canonical `cruiseActive` | Installed cruise resource exposes only a toggle event; modifying the vendor resource is forbidden |
| Exact reverse-vs-neutral gear label | Current gear native reports `0` ambiguously; do not fabricate a distinction |
| Vehicle body health | Reliable native exists, but engine health already satisfies the approved need without another native call |
| Normalized bicycle full state | Sending the existing `car` action for bicycles would make the current frontend appear and alter behavior |
| Nitro normalization | Canonical owner/units remain unresolved under HUD-035 |
| Oxygen/stamina normalization | Existing field overload requires a separately approved compatibility design |

## 11. Adaptive aircraft cluster

Backlog item **HUD-066** owns the deferred visual requirement.

The future vehicle cluster is context-aware:

- Road vehicles, motorcycles, bicycles, and boats use speed as the primary
  center metric.
- Helicopters and planes use altitude as the primary center metric.
- Aircraft speed moves to a secondary position.
- The overall cluster footprint should remain consistent where practical.
- Altitude must display an explicit unit.
- Lua provides speed and altitude simultaneously.
- Lua exposes aircraft identity through `vehicleType` and `isAircraft`.
- The frontend chooses visual positions; Phase 3 does not change layout.

Conceptual only:

```text
Road vehicle

      RPM
 Gear  55 MPH  Belt
      Fuel

Aircraft

      RPM
Speed  850 FT  Gear
      Fuel
```

Typography, positioning, and final indicator selection belong to the frontend
replacement phase.
