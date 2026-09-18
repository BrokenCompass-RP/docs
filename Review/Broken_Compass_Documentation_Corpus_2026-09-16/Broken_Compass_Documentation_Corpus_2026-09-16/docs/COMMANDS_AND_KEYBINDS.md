# Broken Compass RP commands and keybinds

This is the canonical Broken Compass reference for registered commands and keybinds in the active server resource tree. It was audited from source on 2026-09-14. A slash name is a chat/F8 command; a key in this document is its **default**, not a permanent assignment. FiveM mappings made with `RegisterKeyMapping` (including ox_lib `lib.addKeybind`) are rebindable in FiveM settings. Names derived from localization, convars, or configuration can change without editing the registration call.

Scope: `server.cfg`, `local-resources.cfg`, `permissions.cfg`, the resource manifests and registration sites under `[bcrp]`, `[qbx]`, `[ox]`, `[srp]`, `[standalone]`, `[voice]`, `[npwd]`, `[npwd-apps]`, `[discord]`, and the started CFX defaults. Source-only registrations behind a false feature/debug switch are identified below; commented examples, tests, inactive framework branches, exports, NUI callbacks, and normal `ox_target` entries are not counted as live commands. The older [command inventory](Controls/commands.md) and [hotkey inventory](Controls/controls.md) are historical cross-checks; this file takes precedence where they disagree.

**Inventory counts:** 116 distinct player/job slash names; 85 rebindable player action mappings (including five emote slots with no default key) and four additional fixed spotlight control inputs; 76 distinct staff/admin slash names; 63 currently registered developer/debug slash names plus 15 source-only names disabled by current flags. These counts treat aliases as separate names, `+`/`-` hold counterparts as one mapped action, and duplicate owners of one slash spelling as one name within an audience. A command shown in both the player and developer sections is counted once in each audience because its ordinary use and diagnostic purpose differ.

## Player commands

Commands in a grouped cell have the same audience and closely related behavior. Each slash name is a separate registered name unless explicitly described as a conditional or alias.

| Command | Action | Restrictions / requirements | Resource |
| --- | --- | --- | --- |
| `/311`, `/311a`, `/911`, `/911a` | Send non-emergency/emergency dispatch report; `a` variants are anonymous | Message; no registration restriction | `ps-dispatch` |
| `/report` | Send a report to staff | Message; no registration restriction | `qbx_adminmenu` |
| `/refreshPerms` | Refresh own Discord ACE permissions | Enabled in `DiscordAcePerms/config.lua`; Discord identifier and 600-second cooldown | `DiscordAcePerms` |
| `/ooc`, `/me` | Out-of-character chat / local roleplay action | Message | `qbx_core` |
| `/id`, `/job`, `/gang` | Show server ID, current job, or gang | Character loaded | `qbx_core` |
| `/changejob` | Switch among assigned jobs | Must have the job | `qbx_core` |
| `/logout` | Log out the current character | Character loaded | `qbx_core` |
| `/bank` (localized) | Show own bank balance through the BCRP HUD | Open at registration | `bcrp-hud` |
| `/resethud`, `/hideui`, `/showui`, `/toggleui` | Restart HUD or set/toggle persistent manual HUD visibility | Local client; no permission check | `bcrp-hud` |
| `/togglecount`, `/togglecounts` | Toggle player-count overlay | Local client | `bcrp-playercount` |
| `/printshop`, `/printreviews` | Open print submission or review UI | Client-side UI/context checks | `bcrp-printshop` |
| `/sling`, `/resetsling` | Configure/reset weapon sling position | Client; sling config says `permission = any` | `bcrp-sling` |
| `/slingpreset` | Open shared sling-preset configurator | Client opens UI; server permits preset mutations only to console or configured admin ACE/identifier allowlist | `bcrp-sling` |
| `/attackline` | Request or return firehose attack line | Server firefighter/on-duty or configured admin path; nearby apparatus and line state | `bcrp-firehose` |
| `/putdownhose` | Put down carried attack-line nozzle | Only while carrying an authorized session; also mapped to Backspace | `bcrp-firehose` |
| `/spotlight` | Toggle vehicle spotlight | Vehicle/config/server access checks; command exists client and server | `bcrp-spotlight` |
| `/evidence` | Open police evidence registry | Server checks configured on-duty police job/minimum grade | `bcrp-forensics` |
| `/csi_camera_capture` | Capture CSI camera image | CSI camera active; local client command | `bcrp-forensics` |
| `/clearevidence` | Clear a police evidence locker | Police group and boss grade checked in server handler | `ox_inventory` |
| `/clearprops` | Clear personally attached/placed RP props | Local client command | `bcrp-rptools` |
| `/spikestrip`, `/pobject`, `/cuff`, `/sc`, `/escort`, `/clearcasings`, `/clearblood`, `/seizecash` | Police field actions and evidence cleanup | Server `IsLeoAndOnDuty` guard | `qbx_police` |
| `/callsign`, `/cam`, `/flagplate`, `/unflagplate`, `/plateinfo` | Police identity, cameras, and plate records | Police on-duty/rank checks in handlers | `qbx_police` |
| `/grantlicense`, `/revokelicense` | Change a person's license metadata | On-duty police at configured `licenseRank` | `qbx_police` |
| `/depot`, `/impound`, `/paytow`, `/paylawyer`, `/anklet`, `/ankletlocation`, `/takedna`, `/911p` | Police impound, payment, tracking, DNA, and police emergency actions | Police/job and situational checks in handlers; `/911p` dispatch-specific | `qbx_police` |
| `/jail`, `/unjail` | Jail or release a person | Both `qbx_police` and `xt-prison` register these; police checks apply, but **ownership collides** | `qbx_police`, `xt-prison` |
| `/jailtime` | Show remaining sentence | Unrestricted registration; own jail state | `xt-prison` |
| `/prisoners` | Show private jail roster | `utils.isCop(source)` in handler | `xt-prison` |
| `/emsactions` | Open EMS menu | EMS job/menu checks | `randol_medical` |
| `/dispatch` | Open dispatch menu | Dispatch job/context | `ps-dispatch` |
| `/complaint`, `/mdt`, `/mdtclose` | File IA complaint; open/close MDT | `/mdt` name from enabled config; job/session checks for MDT | `ps-mdt` |
| `/newscam`, `/newsmic`, `/newsbmic` | Equip news camera, mic, or boom mic | News job/item checks | `qbx_newsjob` |
| `/npc`, `/tow` | Toggle tow NPC jobs or start tow action | Tow job/state checks | `qbx_towjob` |
| `/transfervehicle` | Transfer vehicle ownership | Shop/vehicle validation | `qbx_vehicleshop` |
| `/givekeys`, `/addkeys` (localized names) | Give/add vehicle keys | Vehicle/key and command-specific checks | `qbx_vehiclekeys` |
| `/getintrunk`, `/putintrunk` | Enter trunk or put someone in it | Vehicle/trunk context | `qbx_radialmenu` |
| `/joboutfits`, `/gangoutfits`, `/reloadskin`, `/clearstuckprops` | Outfit menus or appearance recovery | Job/gang context for outfit menus | `illenium-appearance` |
| `/givecash` | Give nearby player cash | Money/target validation; no ACE at registration | `Renewed-Banking` |
| `/taxi`, `/taxigo`, `/taxifast`, `/taxislow` | Call/control NPC taxi | Taxi trip/waypoint context | `citra-taxi` |
| `/livery` | Select current vehicle livery | In supported vehicle | `1v_changelivery` |
| `/aim` | Select weapon aim animation | Enabled in `nd_gunanims/data/aim.lua`; client command | `nd_gunanims` |
| `/surf`, `/fixstuckskateboard` | Place/pick surfboard or clear stuck board | Boarding context | `jim-boarding` |
| `/showodohud`, `/hideodohud` | Show or hide odometer HUD | Local client commands | `jim-mechanic` |
| `/streamermode` | Toggle xSound streamer mode | Client-side | `xsound` |
| `/ox_lib` | Open ox_lib settings | Client-side | `ox_lib` |
| `/startfueling` | Fuel nearby eligible vehicle | Pump/can/vehicle context; also mapped to E | `ox_fuel` |
| `/steal` | Open nearby player's inventory | ox_inventory proximity/state checks | `ox_inventory` |
| `/jobmenu` | Open multijob UI | Own jobs; also mapped to J | `ps-multijob` |
| `/wheel` | Open wheel game | Local game context | `pickle_wheel` |
| `/stretchermenu`, `/stretcher`, `/delstretcher`, `/mdstretcher` | Stretcher menu, placement, removal | Shared/client registrations and possible framework job checks; verify in game | `stretcher` |
| `/setvoiceintent`, `/vol`, `/cycleproximity` | Change voice intent/volume/proximity | Client; proximity also mapped to F11 | `pma-voice` |
| `/phone`, `/phone:restart` | Open configured NPWD phone / restart its UI | NPWD config and phone-item gate if enabled; `/phone` default is config-derived | `npwd` |
| `/directory` | Open local guide/directory | `Config.Command.enabled = true` | `bcrp-phone-directory` |
| `/em`, `/emotemenu`, `/e`, `/emote`, `/eplay`, `/w`, `/walk`, `/f`, `/face` | Emote menu, play emote, set walk, or expression | Default convar arrays; can be overridden | `scully_emotemenu` |
| `/toggleChat`, `/say` | Toggle chat / server chat command | CFX chat; L mapping for toggle | `chat` |

## Player keybinds

Every row marked **Yes** is a FiveM mapping, including `lib.addKeybind`. Existing player overrides take precedence over the shown default. `+`/`-` commands created for hold mappings are implementation details, not additional slash actions.

| Default key | Registered action / what it does | Rebindable | Context / requirements | Resource |
| --- | --- | --- | --- | --- |
| `I` | `+hud_menu`: HUD settings | Yes | HUD active | `bcrp-hud` |
| `F9`, `F10` | `+Toggle Windows`, `+bcrp_anchor`: front windows / boat anchor | Yes | Driver / anchorable boat | `srp-vehiclecontrols` |
| `Backspace` (`BACK`) | `putdownhose`: drop attack-line nozzle | Yes | Carrying valid line | `bcrp-firehose` |
| `G` | `+bcrp_fires_send_local_crews`: hand off automatic fire to local crews | Yes | Eligible active fire | `bcrp-fires` |
| `X` | `+stopEscort`: stop police escort | Yes | Escorting | `qbx_police` |
| `E` / controller right index | `+despawnSpikeStrip`: remove spike strip | Yes | Working on-duty LEO; secondary controller mapping | `qbx_police` |
| `X`, `Space` | `neveradev:sit:stand_up_x`, `neveradev:sit:stand_up_space` | Yes | Seated in Nevera chair system | `bcrp-rptools` |
| `E` | `startfueling`: start fueling | Yes | Fueling context | `ox_fuel` |
| Config `client.keys[1..3]` | `inv`, `inv2`, `hotbar`: inventory, secondary inventory, hotbar | Yes | Inventory enabled | `ox_inventory` |
| `R`, `1`–`5` | `reloadweapon`, `hotkey1`–`hotkey5` | Yes | Compatible weapon/items and hotkeys enabled | `ox_inventory` |
| `Z` | `ox_lib-radial`: radial menu | Yes | Radial enabled | `ox_lib` |
| `X` | `cancelprogress`: cancel cancellable progress | Yes | Active progress | `ox_lib` |
| Convar `ox_target:defaultHotkey` (`LMENU`) | `+ox_target`: target eye | Yes | Nearby target; resource config | `ox_target` |
| `LMENU`, `F11` | `+radiotalk`, `cycleproximity` | Yes | Radio equipped/channel; voice enabled | `pma-voice` |
| Config `toggleKey` (`F1`) | `phone`: toggle NPWD | Yes | Phone allowed/item if configured | `npwd` |
| `F5` | First configured emote-menu command (default `em`) | Yes | Menu enabled | `scully_emotemenu` |
| `X`, `G`, `H`, `LCONTROL`, `B`, `U` | Cancel emote, particle effect, hands up, stance, point, ragdoll | Yes | Respective emote/state options; convar defaults | `scully_emotemenu` |
| Unbound | `+emotebindKey-1` through `-5`: play assigned emote | Yes | `enableEmoteBinds` and assigned emote; no default key | `scully_emotemenu` |
| `F6` | `emsactions`: EMS menu | Yes | EMS job | `randol_medical` |
| `E`, `O` | `+RespondToDispatch`, `+OpenDispatchMenu` | Yes | Dispatch job/call; values from config | `ps-dispatch` |
| `Left mouse`, `W`, `R`, `Q`, `Enter`, `LMENU` | MDT gizmo select, translate, rotate, local mode, close, snap | Yes | MDT editor open; `S` scale mapping is disabled by `enableScale = false` | `ps-mdt` |
| `F3` | `F3` command forwards to `/mdt` | Yes | MDT key enabled in `ps-mdt/config.lua` | `ps-mdt` / `ps_lib` |
| `B` | `+toggleseatbelt` | Yes | Vehicle, seatbelt enabled | `qbx_seatbelt` |
| `L`, configured `keySearchBind`, `H` | `+togglelocks`, `+toggleengine`, `+searchkeys` | Yes | Vehicle/keys context | `qbx_vehiclekeys` |
| `K`, `E`, configured shuffle key, `Y` | `+crouch`, `+tackle`, `+shuffleSeat`, `+toggle_cruise_control` | Yes | Appropriate character/vehicle state | `qbx_smallresources` |
| `E` | `+passage`: contextual teleport passage | Yes | Near configured passage | `qbx_smallresources` |
| Configured key | `+binoculars`: binoculars | Yes | Binoculars item/use | `qbx_binoculars` |
| `T`, `R`, left mouse, `L` | Property gizmo translation, rotation, select, local modes | Yes | Decorating only | `qbx_properties` |
| `F` | Taxi action | Yes | Taxi trip | `citra-taxi` |
| `G`, `W`, `S`, `A`, `D`, `Space`, `H`, `C` | `skategetoff`, movement, jump, camera lock/flip | Yes | Board attached | `jim-boarding` |
| `G` | `getoffnext`: request next train stop | Yes | Riding train | `jim-trains` |
| `B` | `toggleseatbelt`: mechanic seatbelt toggle | Yes | If jim-mechanic seatbelt module is enabled | `jim-mechanic` |
| `Page Up`, `Page Down`, `Left Ctrl`, `Left Shift` | NOS level up/down, switch, boost | Yes | Nitro installed/enabled | `jim-mechanic` |
| `J` | `jobmenu`: multijob UI | Yes | Own jobs | `ps-multijob` |
| `F5`, `L`, `Num8`, `Num5`, `Num9`, `Num6` | Radar remote, key lock, front/rear antenna and plate reader locks | Yes | Police radar vehicle; config defaults | `wk_wars2x` |
| `H` | `+handsup`: surrender | Yes | AAHU enabled | `AAHU` |
| `L` | `toggleChat`: toggle chat | Yes | Chat resource | `chat` |

## Staff and administrative commands

`lib.addCommand({ restricted = 'group.admin' })` uses ox_lib/FiveM ACE `command.<name>` grants. `permissions.cfg` grants `group.admin command allow`, and developer groups inherit admin. A custom permission string is **not** automatically covered by that blanket `command` ACE. Job checks below are usually in handlers, not ACE restrictions.

| Command | Action | Permission | Resource | Notes |
| --- | --- | --- | --- | --- |
| `/admin`, `/noclip`, `/names`, `/blips` | Admin UI/movement/overlays | `mod` ACE from `qbx_adminmenu/config/server.lua` | `qbx_adminmenu` | Staff group |
| `/admincar`, `/setmodel` | Vehicle/model override | `admin` ACE from `qbx_adminmenu/config/server.lua` | `qbx_adminmenu` | Admin group |
| `/tp`, `/tpm`, `/car`, `/dv`, `/togglepvp` | Teleport, spawn/delete vehicle, PVP | `group.admin` | `qbx_core` | `closeserver` also checks `admin` ACE in body |
| `/addpermission`, `/removepermission`, `/openserver`, `/closeserver` | Permission/server maintenance | `group.admin`, with additional `admin` ACE in open/close path | `qbx_core` | High impact |
| `/givemoney`, `/setmoney`, `/setjob`, `/addjob`, `/removejob`, `/setgang`, `/deletechar`, `/logout` | Money, job, gang, character management and logout override | `group.admin` for every listed registration | `qbx_core` | `/addjob` and `/removejob` collide with console-only ps-multijob registrations |
| `/additem`, `/giveitem`, `/removeitem`, `/setitem`, `/takeinv`, `/restoreinv`, `/returninv`, `/clearinv`, `/saveinv`, `/viewinv` | Inventory administration | `group.admin` | `ox_inventory` | Two alias pairs |
| `/doorlock` | Doorlock editor | `Config.CommandPrincipal = 'group.admin'` | `ox_doorlock` | ox_lib registered ACE |
| `/pedmenu` | Change player ped appearance | `group.admin` | `illenium-appearance` | Target argument supported |
| `/kill`, `/revive`, `/reviveall`, `/revivenear` | Medical overrides | `group.admin` | `randol_medical` | High impact |
| `/weather`, `/time`, `/noon`, `/morning`, `/evening`, `/night`, `/timescale`, `/freezetime` | Weather/time control | `group.admin`; time controls require non-real-time mode | `Renewed-Weathersync` | Server-only operations |
| `/cleargarbroutes` | Clear garbage-route state | `group.admin` | `qbx_garbagejob` | Maintenance |
| `/startshow` | Start fireworks show | `group.admin` | `qbx_fireworks` | — |
| `/newdealer`, `/deletedealer`, `/dealers`, `/dealergoto` | Drug-dealer admin maintenance | `group.admin` | `qbx_drugs` | — |
| `/createproperty` | Create property | Realtor/admin handler checks | `qbx_properties` | Job policy is separate from ACE |
| `/buildings`, `/buildingmanager`, `/createapartmentbuilding`, `/cloneproperty`, `/renumberapartments`, `/listproperties`, `/deleteproperty`, `/renameproperty`, `/editapartmentbuilding`, `/moveentrance`, `/movegarage`, `/fixbucket`, `/bucketstatus`, `/officeeject` | Building/property administration | Server `IsPlayerAceAllowed(source, 'bcrp.propertytools')` for write/pass-through; manager commands also register restricted ACE | `bcrp-propertytools` | Custom ACE grant not found in checked `permissions.cfg` |
| `/storyspawn` | Spawn configured story vehicle | `BCRPAdmin.HasPermission`: configured Qbox group or `bcrp.admintools`/tool/legacy ACE | `bcrp-admintools` | Configurable name |
| `/motd` | Set MDT bulletin message of the day | Police job **and boss** in server handler; enabled in MDT config | `ps-mdt` | Not a general admin command |
| `/drugadmin`, `/getGroundHash` (localized) | Drug plant/table admin menu and ground-hash inspection | Server `IsPlayerAceAllowed(source, 'it-drugs')` | `it-drugs` | Locale may change capitalization |
| `/propplacer` | Open prop-placement editor | Native restricted `command.propplacer` plus handler `IsPlayerAceAllowed(source, 'command')` | `kq_propplacer` | Broad `command` ACE is granted to `group.admin` |
| `/setmarket` | Set beach market interior/state | Handler `IsPlayerAceAllowed(source, 'market')` | `scully_beachmarket` | `permissions.cfg` grants `market` to `group.market` |
| `/muteply` | Mute voice player | Native restricted `command.muteply` ACE | `pma-voice` | Permission supplied by `RegisterCommand(..., true)` |
| `/cash` (localized) | Show own cash balance in HUD | `group.admin` | `bcrp-hud` | Contrasts with open `/bank` |
| `/addjob`, `/removejob` (ps-multijob versions) | Add/remove a multijob assignment | QBCore `Commands.Add(..., 'admin')` | `ps-multijob` | These **also** register names used by `qbx_core`; callbacks require `source ~= 0` |

## Developer and debug commands

“Client open” means no server ACE can protect the local registration. A feature gate may make the command inert; it is still useful to identify its source. Console-only commands are listed in the next section.

| Command | Purpose | Availability / gate | Resource | Production concern |
| --- | --- | --- | --- | --- |
| `/dev` | Toggle BCRP HUD dev indicator | `group.admin` | `bcrp-hud` | Low |
| `/vec2`, `/vec3`, `/vec4`, `/heading` | Copy coordinates/heading | `qbx_adminmenu` configured `dev` ACE | `qbx_adminmenu` | Low |
| `/admintoolsperm` | Print admin-tool permission resolution | **No permission check**; player inspects self, console may specify player ID | `bcrp-admintools` | Prints ACE/group results to server console |
| `/bcrpfiretest`, `/firetestmode`, `/clearfires`, `/firehit`, `/incidentstatus`, `/fireoverhaulstatus`, `/forcereignite`, `/forceclearoverhaul` | Fire incident test/status/overrides | `Config.Commands.restricted = group.admin` | `bcrp-fires` | Force commands change live incidents |
| `/hosenozzle` | Legacy debug hose equip toggle | `Config.Debug.enabled` false in checked config and `restricted = true`; attack-line enabled also blocks | `bcrp-firehose` | Inert at present |
| `/hosewater` | Test hose water path | Qbox admin/console guard **and** `Config.Debug.enabled = false` | `bcrp-firehose` | Registered but inert at present |
| `/hoseconnection`, `/hosecoupling` | Connection and coupling calibration | Registered client commands; both immediately return while `Config.Debug.enabled = false` | `bcrp-firehose` | No local ACE if debug is enabled |
| `/hosetestpose`, `/hoseropetest` | Pose and rope diagnostics | **Not registered** while `Config.Debug.enabled = false`; rope also needs `Debug.ropeTest` | `bcrp-firehose` | Client-open if enabled |
| `/hosesling` | Hose sling offset calibration | Client command in loaded calibration module | `bcrp-firehose` | No ACE at registration |
| `/hoseapparatus`, `/hosehydrant` | Apparatus/hydrant offset calibration | Feature `enabled = false` in config, so inert at present | `bcrp-firehose` | `restricted = false` if enabled |
| `/nozzle`, `/noz` | Temporary nozzle emission calibration | **Not registered:** file returns before registration (`DEBUG_UTILITY_ENABLED = false`) | `bcrp-firehose` | Do not list as usable commands |
| `/firetoolholds`, `/releaseallfiretoolholds` | Firetool state diagnostics | Client registration; no ACE visible | `bcrp-firetools` | Exposed when module loads |
| `/testscbasound` | SCBA sound test | **Not registered** while both fire-vest debug settings are false | `bcrp-firetools`, `bcrp-rptools` | Source-only at present |
| `/firetoolpropcheck` | Validate firetool prop assets | Registered but inert while `Config.Debug.propAssets.enabled = false` | `bcrp-firetools` | No ACE if debug is enabled |
| `/bcrpshotgundebug` | Shotgun balance diagnostics | **Not registered** while `Config.Debug = false` | `bcrp-combat-balance` | Debug-only client command |
| `/bcrp_forensics_build`, `/bcrp_forensics_server_build`, `/bcrp_forensics_marker_stats`, `/forensicsnearby` | Version and evidence diagnostics | First three **not registered** while `Config.Debug = false`; `forensicsnearby` requires on-duty police | `bcrp-forensics` | Low at current config |
| `/forensicpoints`, `/forensicstestblood`, `/forensicstestclear` | Evidence point/blood test and cleanup | `group.admin` | `bcrp-forensics` | Synthetic or destructive evidence changes |
| `/csi_toolbox_prop` | CSI toolbox prop offset debug | Only when `Config.Debug` sets `debugCommand` | `bcrp-forensics` | Disabled by default if debug false |
| `/bcrpmediahealth`, `/bcrp_media:health` | Media API health print | Native restricted command ACE (`command.<name>`) | `bcrp-media` | Operational |
| `/bcrpboomboxstatus` | Print unresolved boombox/cassette custody state | Native restricted ACE | `bcrp-rptools` | Writes server-console summary |
| `/boomboxpreview`, `/clearboomboxpreview`, `/boomboxui` | Boombox visual previews | **Not registered** while `SrpItemsConfig.Debug = false`; native restricted if enabled | `bcrp-rptools` | Source-only at present |
| `/officedebug`, `/officebuildings` | Office instance and registry diagnostics | `bcrp.propertytools` handler guard | `bcrp-propertytools` | No custom ACE grant found |
| `/fenceprices`, `/questhintlocs`, `/roamingstate`, `/roamingmove`, `/blackmarketstate`, `/blackmarketmove` | Quest/NPC/market state and force movement | **Server console only** (`source == 0`) | `bcrp-quest-hints`, `bcrp-roaming`, `bcrp-blackmarket` | No player exposure |
| `/ryditest` | Ride app synthetic test | **Not registered** while `Config.Debug = false`; also needs synthetic drivers enabled | `bcrp-phone-rydi` | Source-only at present |
| `/testemail` | Send test mail to phone | `group.admin` | `npwd_qbx_mail` | Active test action |
| `/testgames` | Open arcade test supercomputer | QBCore `Commands.Add(..., 'admin')` | `d3-arcade` | Admin-gated test action |
| `/showsounds` | xSound diagnostic overlay/list | Debug module/client | `xsound` | Potentially public |
| `/testVarHack`, `/testThermite`, `/testScrambler`, `/testMaze`, `/testNotify`, `/testanput`, `/testDrawText`, `/hideDrawText`, `/coordGrab`, `/testContext`, `/testCircle`, `/testCopyClipboard` | ps_lib UI and clipboard demos; `/coordGrab` is a developer coordinate authoring tool | Registered only when `Config.Debug == true` (false in current config) | `ps_lib` | Debug-only; unavailable in normal production |
| `/mysql` | Open oxmysql query UI | Registered in bundled JS; only when `mysql_ui` is enabled and from a player | `oxmysql` | Check UI permission before enabling |
| `/record`, `/clip`, `/saveclip`, `/delclip`, `/editor` | Rockstar editor controls | Client registration | `qbx_smallresources` | Player-accessible dev tooling |
| `/zone` | ox_lib zone authoring tool | Client registration | `ox_lib` | Check admin/debug gate before production |

## Other registered and internal actions

| Action | Availability and purpose | Resource |
| --- | --- | --- |
| `/convertinventory` | Server console only; migrate inventory backend | `ox_inventory` |
| `/convertjobs`, `/cleanplayergroups` | Qbox maintenance; server console/source guard | `qbx_core` |
| `/clearActiveIdentifier` | Server console only; clear inventory active-identifier state | `ox_inventory` |
| `/oxmysql_debug` | Server console only; set oxmysql debug filters | `oxmysql` |
| `+radiotalk`/`-radiotalk`, `+stopEscort`/`-stopEscort`, ox_lib-generated `+name`/`-name` | Hold-key implementation commands; rebind via settings, do not type as gameplay slash commands | Multiple |
| Spotlight movement controls `124`/`125`/`126`/`127` | Configured GTA control polling moves an enabled emergency-vehicle spotlight left/right/down/up. These are **not** `RegisterKeyMapping` actions; edit config/GTA controls rather than FiveM resource keybind settings. | `bcrp-spotlight` |
| `/closeBankUI`, `/mdtclose`, `/cancelprogress`, `reset_radar_data` | Directly registered convenience/UI cleanup commands; mainly invoked by UI or mapped controls | `Renewed-Banking`, `ps-mdt`, `ox_lib`, `wk_wars2x` |
| `run`, `crun`, `runcode` | CFX `runcode` resource exists on disk; its startup was **not established** from the active ensures and should not be treated as available. It executes arbitrary code if started. | `runcode` |
| `earn`, `spend`, `playerData` | CFX example resources on disk; no active ensure established | CFX examples |
| `testResource` | Badger Discord API example file; manifest loading not established | `Badger_Discord_API` |
| `lib.addCommand`, QBCore bridge, `ps_lib` command wrapper, `scully_emotemenu` utility, `ox_lib` keybind bridge | Registration factories, not commands by themselves; calls through them are counted under the owning resource when resolved | Framework libraries |

## Resource index

This compact index points maintainers to ownership; the audience tables above describe action and access. Each resource is a directory under `resources/[group]/<resource>` (for example, `bcrp-firehose` is `resources/[bcrp]/bcrp-firehose`). Registration is commonly in `server/commands.lua`, `server/main.lua`, or the indicated client module; search the exact name within the resource before editing. Names in parentheses are conditional/config-derived.

| Resource | Registered commands / mappings |
| --- | --- |
| `bcrp-admintools` | `admintoolsperm`, `storyspawn` |
| `bcrp-blackmarket` | `blackmarketstate`, `blackmarketmove` (console) |
| `bcrp-combat-balance` | Debug-only `bcrpshotgundebug` (not registered in current config) |
| `bcrp-firehose` | `attackline`, `putdownhose`, `hosecoupling`, `hosenozzle`, `hosewater`, `hoseconnection`, `hosesling`; source-only disabled `hosetestpose`, `hoseropetest`, `hoseapparatus`, `hosehydrant`, `nozzle`, `noz` |
| `bcrp-fires` | `bcrpfiretest`, `firetestmode`, `clearfires`, `firehit`, `incidentstatus`, `fireoverhaulstatus`, `forcereignite`, `forceclearoverhaul`; local-crews G bind |
| `bcrp-firetools` | `firetoolholds`, `releaseallfiretoolholds`, `testscbasound`, inert `firetoolpropcheck` |
| `bcrp-forensics` | `evidence`, `csi_camera_capture`, build/stats commands, `forensicsnearby`, `forensicpoints`, blood tests, conditional toolbox debug |
| `bcrp-hud` | localized `cash`/`bank`, `dev`, `resethud`, `hideui`, `showui`, `toggleui`; HUD I bind |
| `bcrp-media` | `bcrpmediahealth`, `bcrp_media:health` |
| `bcrp-playercount` | `togglecount`, `togglecounts` |
| `bcrp-printshop` | `printshop`, `printreviews` |
| `bcrp-propertytools` | property command family, `buildings`, `buildingmanager`, `officebuildings`, `officedebug`, `officeeject` |
| `bcrp-quest-hints` | `fenceprices`, `questhintlocs` (console) |
| `bcrp-roaming` | `roamingstate`, `roamingmove` (console) |
| `bcrp-rptools` | `clearprops`, boombox commands, Nevera stand-up mappings, SCBA sound test |
| `bcrp-sling` | `sling`, `resetsling`, `slingpreset` |
| `bcrp-spotlight` | `spotlight`, configured movement controls |
| `qbx_police` | police command family, `911p`, `jail`/`unjail`, escort X bind |
| `qbx_core` | player chat/info/job commands and admin maintenance family |
| `qbx_adminmenu` | `report`, `admin`, `noclip`, `names`, `blips`, `admincar`, `setmodel`, coordinate helpers |
| `qbx_vehiclekeys` | localized key-giving commands; lock/engine/search binds |
| `qbx_properties` | `createproperty`; decorator gizmo bindings |
| `qbx_radialmenu` | `getintrunk`, `putintrunk` |
| `qbx_newsjob` | `newscam`, `newsmic`, `newsbmic` |
| `qbx_towjob` | `npc`, `tow` |
| `qbx_vehicleshop` | `transfervehicle` |
| `qbx_drugs` | dealer administration family |
| `qbx_garbagejob` | `cleargarbroutes` |
| `qbx_fireworks` | `startshow` |
| `qbx_smallresources` | Rockstar editor commands; crouch/tackle/teleport/cruise/seat-shuffle binds |
| `qbx_seatbelt`, `qbx_binoculars` | Seatbelt and binocular bindings |
| `srp-vehiclecontrols` | F9 windows, F10 anchor bindings; no separate slash commands |
| `ox_inventory` | inventory admin commands, `steal`, inventory/hotbar mappings, migration/maintenance |
| `ox_fuel`, `ox_target`, `ox_doorlock` | `startfueling` E; target LMENU; `/doorlock` |
| `ox_lib` | `/ox_lib`, `/zone`, `/cancelprogress`, radial Z; registration factories |
| `npwd`, `bcrp-phone-directory`, `bcrp-phone-rydi`, `npwd_qbx_mail` | Phone toggle/restart; `directory`; `ryditest`; `testemail` |
| `pma-voice` | `muteply`, voice intent/volume/proximity/radio actions |
| `ps-dispatch`, `ps-mdt`, `ps-multijob`, `ps_lib` | Dispatch/report and binds; MDT/complaint/gizmo; job menu and duplicate admin job commands; UI demos |
| `oxmysql` | `oxmysql_debug` (console), `mysql` (conditional UI) |
| `scully_emotemenu`, `AAHU` | Configured emote commands and mappings; surrender H |
| `jim-boarding`, `jim-trains`, `jim-mechanic` | Surf/board commands and binds; train G; seatbelt/NOS/odometer commands |
| `wk_wars2x`, `randol_medical`, `xt-prison`, `stretcher` | Radar controls; EMS/admin medical; jail; stretcher controls |
| `1v_changelivery`, `citra-taxi`, `d3-arcade`, `illenium-appearance`, `it-drugs`, `kq_propplacer`, `MugShotBase64`, `nd_gunanims`, `pickle_wheel`, `Renewed-Banking`, `Renewed-Weathersync`, `scully_beachmarket`, `xsound` | See audience tables; several vendor names/config gates need deployment verification |
| `chat`, `DiscordAcePerms` | Chat toggle/say; permission refresh |

## Audit findings

1. **Duplicate registrations:** `qbx_police` and `xt-prison` both register `/jail` and `/unjail`; `xt-prison` has `EnableJailCommand = true`. `qbx_core` and `ps-multijob` both register `/addjob` and `/removejob`, with admin-gated player callbacks in both. `stretcher` registers `/stretchermenu` in shared and client code. The effective winner may depend on startup order/client-server resolution; do not promise one implementation to staff without runtime verification.
2. **Default-key overlap:** The radial menu now defaults to `Z`; `J` remains the multijob default. `F5` can open the emote menu while the radar remote is usable in a police vehicle, and `B` can reach both Qbox and Jim's seatbelt handlers in an eligible vehicle when both resources are active; neither overlap was changed in this pass. Other repeated defaults (`G`, `X`, and contextual `E`) are context-gated and are not classified as conflicts without evidence that both actions execute in one gameplay state. `F9`/`F10` overlap GTA weapon drop/ammo defaults, but the resource mappings are rebindable.
3. **Custom ACE grant gap:** `bcrp-propertytools` checks `bcrp.propertytools` server-side. The checked `permissions.cfg` grants broad `command` rights to admins but does not explicitly grant `bcrp.propertytools`; verify external ACE configuration before expecting these tools to work.
4. **Debug exposure:** `ps_lib` demo commands, `MugShotBase64` capture commands, and several local BCRP diagnostic commands have no visible ACE at their registration. `ps_lib` loads its client modules by wildcard manifest; these demos appear reachable. `/testgames` is admin-gated. No functionality was changed here.
5. **Disabled-source distinction:** `/nozzle` and `/noz` are not live because the script returns at its top; apparatus/hydrant, pose and rope calibration do not register while their debug flags are false; `/hosenozzle`, `/hosewater`, `/hoseconnection`, and `/hosecoupling` register but return while debug is off. The older inventories include some source registrations as if directly usable.
6. **Inventory drift:** The older `docs/Controls` tables include moved `srp-rptools` paths and inactive/example entries. `docs/commands-and-hotkeys.md` describes `qbx_hud` as stopped, but the current `server.cfg` stop line is commented and there is **no `resources/[qbx]/qbx_hud` directory** in this checkout. The BCRP HUD is the present implementation.
7. **Permission uncertainty:** Conditional phone/MDT actions and some vendor config gates still require deployed runtime validation for an exact effective grant. `/admintoolsperm` is openly registered and prints a self-permission diagnostic; it does not grant permissions. This document names visible gates rather than inferring admin rights from command names.
8. **Discoverability:** Several useful recovery controls (`/resethud`, `/clearstuckprops`, `/fixstuckskateboard`, `/jailtime`, `/ox_lib`) are registered but not collected in an in-game help menu. This is a documentation finding only.
9. **Unexpected permission split:** The BCRP HUD's localized `/cash` is `group.admin` while `/bank` is open, even though both display the invoking player's balance. Confirm whether this was intentional before advertising `/cash` to residents.

Audit method: searched registration sites and factories (`RegisterCommand`, `RegisterKeyMapping`, `lib.addCommand`, `lib.addKeybind`, `QBCore.Commands.Add`), configuration-derived command arrays, and chat/phone registrations; then traced immediate handlers and permission checks where the action or audience was ambiguous. No server behavior, permission, keybind, or resource code was modified.
