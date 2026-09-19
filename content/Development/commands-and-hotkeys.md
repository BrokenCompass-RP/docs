# Historical Commands and Default Hotkeys (2026-07-30)

For the current audience-oriented audit, use [COMMANDS_AND_KEYBINDS.md](COMMANDS_AND_KEYBINDS.md). This file preserves the July review and should not be treated as the current canonical inventory.

Reviewed 2026-07-30 against the registrations in the active `server.cfg` resource groups.

The detailed tables produced during that review are:

- [Player-facing commands](Controls/commands.md)
- [Player-facing default hotkeys](Controls/controls.md)
- [Unmapped, internal, and diagnostic registrations](Controls/undocumented-controls.md)

Those tables record the command/keybind name, aliases, resource, exact source registration, default key and mapper where applicable, description, callback behavior, context, permissions, and related events/exports. Dynamic localized command names and convar/config-derived defaults are identified as such rather than guessed.

## Active HUD and vehicle-control registrations

| Type | Command/name | Aliases | Resource and exact file | Default | Description and traced behavior | Context / permission | Status and recommendation |
|---|---|---|---|---|---|---|---|
| Player command | `/toggleui` | `/hideui`, `/showui` are compatibility setters | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/client/main.lua` | None | Toggles the persistent manual HUD-hidden reason through the same authoritative setter used by both aliases | Client/player; unrestricted | Active; primary command; keep and document |
| Player command | `/hideui` | Compatibility alias for hidden state | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/client/main.lua` | None | Persists manual hidden state and hides status, vehicle, navigation, and radar UI without changing temporary suppression reasons | Client/player; unrestricted | Active compatibility alias; retain temporarily |
| Player command | `/showui` | Compatibility alias for visible state | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/client/main.lua` | None | Clears only the persistent manual hidden reason; inventory/cinematic suppression may still hide the UI | Client/player; unrestricted | Active compatibility alias; retain temporarily |
| Player command | `/bank` (localized name) | None | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/server/main.lua` | None | Reads the player's bank balance from Qbox and sends it to the active BCRP money NUI | Client/player; unrestricted | Active; already replaced by the BCRP fork; optional convenience command |
| Staff command | `/cash` (localized name) | None | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/server/main.lua` | None | Reads the player's cash balance from Qbox and sends it to the active BCRP money NUI | `group.admin` | Active; already replaced by the BCRP fork; keep only if the restriction is intentional |
| Staff command | `/dev` | None | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/server/main.lua` | None | Triggers the BCRP client's dev-mode event; the boolean is included in HUD tick payloads and controls the dev indicator | `group.admin` | Active BCRP implementation; not merely an upstream inactive command |
| Player command | `/resethud` | None | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/client/main.lua` | None | Restarts the HUD NUI display sequence | Client/player; unrestricted | Active recovery command; keep |
| Player hotkey | `hud_menu` | None | `bcrp-hud` — `resources/[bcrp]/bcrp-hud/client/main.lua` | `config.menuKey`, keyboard | Opens HUD settings and gives the NUI focus | Client/player | Active and rebindable; keep |
| Player hotkey | `Toggle Windows` | None | `srp-vehiclecontrols` — `resources/[srp]/srp-vehiclecontrols/client.lua` | `F9`, keyboard | Raises/lowers both front windows and replicates `windowState` | Vehicle driver | Active; exactly one registration; keep |
| Player hotkey | `bcrp_anchor` | None | `srp-vehiclecontrols` — `resources/[srp]/srp-vehiclecontrols/client.lua` | `F10`, keyboard | Raises/deploys a model-native boat anchor, replicates `anchorState`, and emits success or blocked notifications | Boat operator; network control; low speed and anchorable water to deploy | Active; exactly one production registration; keep |

## Specifically requested bindings

| Binding | Active source | Default / status | Conflict note |
|---|---|---|---|
| Seatbelt | `qbx_seatbelt` (see detailed hotkey table) | Config-derived, rebindable | Hidden by the HUD for boats; no HUD-owned seatbelt keybind |
| Radio push-to-talk | `pma-voice` | `voice_defaultRadio`, default `LMENU` | No F9/F10 conflict |
| Voice proximity | `pma-voice` | `voice_defaultCycle`, default `F11` | No F9/F10 conflict |
| Phone | `npwd` and its configured framework integration | Config/key-mapping derived; see detailed inventory | No F9/F10 conflict identified in active custom registrations |
| Interaction/target | `ox_target` | Resource-config-derived, rebindable | `setr ox_target:debug 1` is currently enabled in `server.cfg`; production should normally disable it |
| Radial menu | `ox_lib` | `J`, keyboard | No F9/F10 conflict |
| Windows | `srp-vehiclecontrols` | `F9`, keyboard | Exactly one active registration |
| Boat anchor | `srp-vehiclecontrols` | `F10`, keyboard | Exactly one active production registration |

No `IsControlJustReleased` polling for GTA controls 56/F9 or 57/F10 remains in `srp-vehiclecontrols`. It also contains no raw `RegisterKeyMapping` calls or commands that invoke either toggle. Both bindings are registered once through `lib.addKeybind`.

## Inventory categories

- **Player commands:** the alphabetical table in `Controls/commands.md`, excluding entries whose immediate guard is admin/staff/developer/console-only.
- **Player hotkeys:** every entry in `Controls/controls.md`; context requirements are recorded per row.
- **Emergency services:** `qbx_police`, `randol_medical`, `ps-dispatch`, `wk_wars2x`, and emergency-vehicle entries in the detailed tables.
- **Admin/staff:** entries marked restricted/admin, ACE/group guarded, or job-management guarded in `Controls/commands.md`.
- **Developer/debug:** entries described as debug, test, state dump, reset, or developer-only in `Controls/commands.md` and `Controls/undocumented-controls.md`.
- **Console-only/internal:** registrations whose source guard requires `source == 0`, server console, or which exist only as `+`/`-` key-mapping implementation commands are recorded in `Controls/undocumented-controls.md`.

## Active-resource caveat

`qbx_hud` remains present on disk but is explicitly stopped in `server.cfg`; `bcrp-hud` is the active fork. Any historical `qbx_hud` rows in the detailed inventories describe the upstream resource on disk and are not active runtime registrations. The active equivalents are the `bcrp-hud` rows above. Resource-group `ensure` behavior and convar/config-derived command names should be rechecked after resources are added, removed, or renamed.

## Inactive upstream qbx_hud reference

Inactive — owning resource is explicitly stopped.

The upstream `resources/[qbx]/qbx_hud` copies of localized `/cash`, localized `/bank`, `/dev`, and `/resethud` do not register at runtime because `server.cfg` stops `qbx_hud` after ensuring `[qbx]`. They are preserved on disk for historical/reference purposes and were not modified. Equivalent command implementations already exist in active `bcrp-hud`, so recreating them in a separate utility resource would currently cause command conflicts rather than restore missing functionality.
