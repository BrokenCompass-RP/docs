# Undocumented Controls and Audit Notes

These controls are checked directly with GTA control IDs, generated dynamically, or otherwise appear player-facing without a clear standalone keybind/command doc.

## Control ID Resolution

| Control ID | GTA control name | Usual keyboard key |
|---:|---|---|
| `0` | `INPUT_NEXT_CAMERA` | V |
| `8` | `INPUT_SCRIPTED_FLY_UD` / movement axis | S/controller axis |
| `9` | `INPUT_SCRIPTED_FLY_LR` / movement axis | D/controller axis |
| `14` | `INPUT_WEAPON_WHEEL_NEXT` | Mouse wheel down |
| `15` | `INPUT_WEAPON_WHEEL_PREV` | Mouse wheel up |
| `16` | `INPUT_SELECT_NEXT_WEAPON` | Mouse wheel down |
| `17` | `INPUT_SELECT_PREV_WEAPON` | Mouse wheel up |
| `18` | `INPUT_SKIP_CUTSCENE` / Enter | Enter |
| `20` | `INPUT_MULTIPLAYER_INFO` | Z |
| `21` | `INPUT_SPRINT` | Left Shift |
| `22` | `INPUT_JUMP` | Space |
| `23` | `INPUT_ENTER` | F |
| `24` | `INPUT_ATTACK` | Left mouse |
| `25` | `INPUT_AIM` | Right mouse |
| `27` | `INPUT_PHONE` | Arrow up / phone up |
| `32` | `INPUT_MOVE_UP_ONLY` | W |
| `34` | `INPUT_MOVE_LEFT_ONLY` | A |
| `38` | `INPUT_PICKUP` | E |
| `47` | `INPUT_DETONATE` | G |
| `51` | `INPUT_CONTEXT` | E |
| `56` | `INPUT_DROP_WEAPON` | F9 |
| `57` | `INPUT_DROP_AMMO` | F10 |
| `63` | `INPUT_VEH_MOVE_LEFT_ONLY` | A |
| `64` | `INPUT_VEH_MOVE_RIGHT_ONLY` | D |
| `71` | `INPUT_VEH_ACCELERATE` | W |
| `72` | `INPUT_VEH_BRAKE` | S |
| `76` | `INPUT_VEH_HANDBRAKE` | Space |
| `172` | `INPUT_CELLPHONE_UP` | Arrow up |
| `173` | `INPUT_CELLPHONE_DOWN` | Arrow down |
| `174` | `INPUT_CELLPHONE_LEFT` | Arrow left |
| `175` | `INPUT_CELLPHONE_RIGHT` | Arrow right |
| `177` | `INPUT_CELLPHONE_CANCEL` | Backspace / Esc |
| `189` | `INPUT_FRONTEND_LEFT` | Left arrow |
| `190` | `INPUT_FRONTEND_RIGHT` | Right arrow |
| `191` | `INPUT_FRONTEND_RDOWN` | Enter |
| `194` | `INPUT_FRONTEND_RRIGHT` | Backspace |
| `201` | `INPUT_FRONTEND_ACCEPT` | Enter |
| `202` | `INPUT_FRONTEND_CANCEL` | Backspace / Esc |
| `241` | `INPUT_CURSOR_SCROLL_UP` | Mouse wheel up |
| `242` | `INPUT_CURSOR_SCROLL_DOWN` | Mouse wheel down |
| `246` | `INPUT_PUSH_TO_TALK` | N |
| `306` | `INPUT_REPLAY_SHOWHOTKEY` | Keyboard/controller special |
| `322` | `INPUT_REPLAY_HIDEHUD` / Esc | Esc |

## Hidden Direct Controls

| Resource | File:line | Control | What it does | Conditions | Should be configurable? |
|---|---|---|---|---|---|
| `bcrp-propertytools` | `resources/[bcrp]/bcrp-propertytools/client/utils.lua:37` | `190` / right arrow | Moves property placement/preview right | Property tool placement active | Yes |
| `bcrp-propertytools` | `resources/[bcrp]/bcrp-propertytools/client/utils.lua:40` | `189` / left arrow | Moves property placement/preview left | Property tool placement active | Yes |
| `bcrp-propertytools` | `resources/[bcrp]/bcrp-propertytools/client/utils.lua:46` | `202` / Backspace | Cancels property placement | Property tool placement active | Yes |
| `bcrp-propertytools` | `resources/[bcrp]/bcrp-propertytools/client/utils.lua:53` | `18` / Enter | Confirms property placement | Property tool placement active | Yes |
| `srp-welcomehome` | `resources/[srp]/srp-welcomehome/client/main.lua:124` | `38` / E | Interacts with welcome/home prompt | Near configured location | Probably, if prompt remains non-target |
| `srp-welcomehome` | `resources/[srp]/srp-welcomehome/client/main.lua:187` | `38` / E | Interacts with welcome/home prompt | Near configured location | Probably, if prompt remains non-target |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:93` | `174` / left arrow | Rotates prop left | Prop placement active | Yes |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:94` | `175` / right arrow | Rotates prop right | Prop placement active | Yes |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:95` | `27` / up | Raises prop offset | Prop placement active | Yes |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:96` | `173` / down | Lowers prop offset | Prop placement active | Yes |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:100` | `191` / Enter | Places prop | Prop placement active | Yes |
| `srp-rptools` | `resources/[srp]/srp-rptools/srp-items/client/client.lua:126` | `202` / Backspace | Cancels prop placement | Prop placement active | Yes |
| `qbx_busjob` | `resources/[qbx]/qbx_busjob/client/main.lua:128`, `:353` | `38` / E | Bus job interactions | Bus job route/zone | Probably target/prompt bound |
| `qbx_carwash` | `resources/[qbx]/qbx_carwash/client/main.lua:60` | `38` / E | Starts car wash | In car wash zone | Probably |
| `qbx_customs` | `resources/[qbx]/qbx_customs/client/zones.lua:81` | `38` / E | Opens customs | In customs zone/job context | Probably |
| `qbx_customs` | `resources/[qbx]/qbx_customs/client/dragcam.lua:103` | `24` / mouse left | Drag camera/select | Customs camera active | No, mode-specific |
| `qbx_customs` | `resources/[qbx]/qbx_customs/client/dragcam.lua:121` | `22` / Space | Camera/drag action | Customs camera active | No, mode-specific |
| `qbx_customs` | `resources/[qbx]/qbx_customs/client/dragcam.lua:132` | `0` / V | Camera reset/switch | Customs camera active | No, mode-specific |
| `qbx_drugs` | `resources/[qbx]/qbx_drugs/client/deliveries.lua:200`, `:204`, `:208`, `:391` | `38` / E, `47` / G | Accept/complete/cancel drug delivery interactions | Drug delivery active | Probably |
| `qbx_drugs` | `resources/[qbx]/qbx_drugs/client/cornerselling.lua:207`, `:221` | `38` / E, `47` / G | Sell/cancel corner sale | Corner selling active | Probably |
| `qbx_garbagejob` | `resources/[qbx]/qbx_garbagejob/client/main.lua:246`, `:267`, `:443` | `51` / E, `38` / E | Pick up/drop bags and route interaction | Garbage job active | Probably |
| `qbx_management` | `resources/[qbx]/qbx_management/client/main.lua:221` | `51` / E | Opens management interaction | Boss/management zone | Probably |
| `qbx_mechanicjob` | `resources/[qbx]/qbx_mechanicjob/client/main.lua:92`, `:151`, `:182`, `:235`, `:239` | `38` / E | Mechanic interactions | Mechanic locations/job context | Probably |
| `qbx_newsjob` | `resources/[qbx]/qbx_newsjob/client/camera.lua:66`, `:69`, `:78`, `:81`, `:183`, `:282` | scroll/back controls | News camera zoom/mode/back | News camera active | No, camera mode-specific |
| `qbx_properties` | `resources/[qbx]/qbx_properties/client/realtor.lua:71`, `:78`, `:84`, `:90` | `202`, `190`, `189`, `18` | Realtor property placement cancel/move/confirm | Realtor tool active | Yes |
| `qbx_properties` | `resources/[qbx]/qbx_properties/client/property.lua:178`-`:452` | `38` / E, `47` / G | Property enter/exit/garage/storage interactions | Near property markers | Probably |
| `qbx_radialmenu` | `resources/[qbx]/qbx_radialmenu/client/trunk.lua:229`, `:246`, `:256` | `38` / E, `47` / G | Trunk enter/exit interaction | Trunk context | Probably |
| `qbx_smallresources` | `resources/[qbx]/qbx_smallresources/qbx_vehiclepush/client.lua:22` | `21` + `38` / Shift + E | Push vehicle | Near vehicle, not in vehicle | Yes |
| `qbx_vehiclekeys` | `resources/[qbx]/qbx_vehiclekeys/client/main.lua:45`, `:127` | `23` / F | Cancels/times engine keybind while entering/exiting | Driver seat/entry animation | No |
| `stretcher` | `resources/[standalone]/stretcher/client/cl_main.lua:136`, `:246`, `:315`, `:320` | `Config.Keys.*` control IDs | Opens doors/takes/loads/drops stretcher | Stretcher/ambulance context | Yes, if config uses raw IDs only |
| `it-drugs` | `resources/[standalone]/it-drugs/client/cl_processing.lua:105`-`:155` | `14`/`16`, `15`/`17`, `38`, `47` | Processing menu navigation/confirm/cancel | Drug processing active | No, menu/minigame style |
| `it-drugs` | `resources/[standalone]/it-drugs/client/cl_planting.lua:235`-`:266` | `38`, `47` | Plant placement confirm/cancel | Planting active | Probably |
| `it-drugs` | `resources/[standalone]/it-drugs/client/cl_notarget.lua:89`-`:102` | `38` / E | Non-target interactions | Target system disabled | Probably |
| `safecracker` | `resources/[standalone]/safecracker/client.lua:39`-`:47` | `174`, `175`, `322`, `20`, `21` | Safecracker minigame left/right/cancel/speed | Safecracker active | No, minigame controls |
| `ultra-voltlab` | `resources/[standalone]/ultra-voltlab/client.lua:617`-`:664` | arrows, Backspace, Enter | Voltlab minigame navigation/confirm/cancel | Minigame active | No, minigame controls |
| `jim_bridge` | `resources/[standalone]/jim_bridge/ui_modules/skillcheck.lua:45`, `:62` | `177`, `38` | Skillcheck cancel/confirm | Skillcheck active | No, minigame controls |
| `fivem-aerial-tramway` | `resources/[standalone]/fivem-aerial-tramway/cablecar.lua:580`, `:589` | `38` / E | Cablecar interaction | Near tramway controls | Probably |

## Potentially Undocumented Commands

| Command | File:line | Reason |
|---|---|---|
| `blackmarketstate`, `blackmarketmove` | `resources/[bcrp]/bcrp-blackmarket/server/main.lua:533`, `:551` | Debug/admin commands with no chat suggestion found |
| `roamingstate`, `roamingmove` | `resources/[bcrp]/bcrp-roaming/server/main.lua:313`, `:340` | Debug/admin commands with no chat suggestion found |
| `fenceprices`, `questhintlocs` | `resources/[bcrp]/bcrp-quest-hints/server/main.lua:352`, `:361` | Debug/info commands with no chat suggestion found |
| `testemail` | `resources/[npwd-apps]/npwd_qbx_mail/server/server.lua:84` | Admin test command |
| `testscbasound` | `resources/[srp]/srp-rptools/fire_vest/client/client.lua:124` | Test command |

## Summary

### Duplicate keybinds

| Default key | Entries |
|---|---|
| `E` | ox_fuel `startfueling`, qbx_police `despawnSpikeStrip`, qbx_smallresources `passage`, qbx_smallresources `tackle`, many raw `INPUT_PICKUP`/`INPUT_CONTEXT` prompts |
| `G` | jim-boarding `skategetoff`, jim-trains `getoffnext`, several raw `INPUT_DETONATE` cancel/alternate prompts |
| `H` | qbx_vehiclekeys `searchkeys`, jim-boarding `skatecam` |
| `J` | ox_lib radial |
| `K` | qbx crouch |
| `L` | qbx_vehiclekeys `togglelocks`, qbx_properties gizmo local |
| `R` | ox_inventory reload weapon, qbx_properties gizmo rotation |
| `SPACE` | jim-boarding `skatejump`, sit stand-up, many raw jump/minigame checks |
| `X` | ox_lib cancel progress, qbx_police stop escort, Nevera stand-up |
| `Y` | qbx cruise control |
| `F` | citra taxi enter/exit; GTA enter/exit raw checks in vehiclekeys |
| `F9`/`F10` | srp-vehiclecontrols has one ox_lib keybind for each key; no raw control polling remains |

### Conflicting default keys

Most conflicts are context-safe but still worth reviewing:

| Key | Conflict |
|---|---|
| `E` | Heavily overloaded across target-like world interactions, tackle, teleports, spike deletion, fueling, and job prompts. Context guards reduce collisions, but accidental actions are possible. |
| `G` | Skate get-off, train get-off-next, and many accept/cancel secondary prompts. |
| `H` | Search vehicle keys and skateboard camera can conflict when in/near boarding context. |
| `X` | Cancel progress, stop escort, sit stand-up, and other cancel semantics overlap. |
| `R` | Weapon reload and furniture rotation conflict while decorating if weapon controls are not suppressed. |

### Duplicate command names

| Command | Locations |
|---|---|
| `jail` | `xt-prison` and `qbx_police` |
| `unjail` | `xt-prison` and `qbx_police` |
| `migrateskins` | illenium QB and ESX migration files |
| `stretchermenu` | stretcher shared utils and stretcher client menu |
| `togglecount`/`togglecounts` | intentional aliases in bcrp-playercount |
| `additem`/`giveitem`, `restoreinv`/`returninv` | intentional aliases in ox_inventory |

### Unused RegisterKeyMapping entries

No clearly unused mapping was found where the mapped command is absent. The following should be reviewed because they are wrapper/alias mappings:

| Mapping | Reason |
|---|---|
| `neveradev:sit:stand_up_x`, `neveradev:sit:stand_up_space` | Both execute the same stand-up command. |
| `+stopEscort` | Registered from an event in `qbx_police/client/target.lua`; confirm the registration event always runs once. |

### Commands that are never referenced

Many slash commands are intentionally entry points and are not referenced by other code. Commands that look most likely to be debug/test-only are:

| Command | Note |
|---|---|
| `blackmarketstate`, `blackmarketmove`, `roamingstate`, `roamingmove`, `fenceprices`, `questhintlocs` | BCRP debug/admin state commands |
| `testemail`, `testscbasound` | Test/utility commands |
| `reset_radar_data` | Maintenance command |
| `clearActiveIdentifier`, `convertinventory`, `convertjobs`, `cleanplayergroups`, `migrateskins` | Admin/migration utilities |

### Keybinds that should probably become configurable

| Control | Why |
|---|---|
| BCRP/qbx property placement arrows, Enter, Backspace | Frequent builder/realtor workflow; currently raw controls in some modules. |
| srp-rptools prop placement arrows, Enter, Backspace | Player-facing placement tool with hardcoded controls. |
| qbx_smallresources vehicle push Shift+E | Player-facing and likely to collide with interaction prompts. |
| bcrp-spotlight movement controls | Vehicle roleplay feature with raw `Config.*` GTA IDs, not FiveM rebind mappings. |
| stretcher `Config.Keys.*` controls | EMS workflow should be easy to remap through FiveM settings. |
| World interaction prompts using raw E/G | Most are context-limited, but a shared configurable interaction abstraction would reduce accidental overlap. |
