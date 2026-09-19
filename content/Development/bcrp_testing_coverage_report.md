# Broken Compass RP QA Testing Coverage Report

Generated from a read-only repo inspection on 2026-06-30.

## Coverage Counts

| Metric | Count / Estimate | Notes |
|---|---:|---|
| Resource manifests reviewed | 184 | `fxmanifest.lua` + `__resource.lua` files found. |
| Lua files scanned | 1,451 | Client/server/shared/config Lua under `resources`. |
| Config / JSON / SQL files scanned | 688 | Includes `.cfg`, `.json`, `.sql`. |
| Configured Qbox jobs | 18 | `unemployed`, `police`, `bcso`, `sasp`, `ambulance`, `realestate`, `taxi`, `bus`, `cardealer`, `mechanic`, `judge`, `lawyer`, `reporter`, `trucker`, `tow`, `garbage`, `vineyard`, `hotdog`. |
| Configured shop definitions | 61 | From `resources/[ox]/ox_inventory/data/shops.lua`; includes vending, job armouries, business counters, black market/drug shops. |
| Inventory item definitions | 165 | From `resources/[ox]/ox_inventory/data/items.lua`. |
| Command registration signals | 259 | Includes vendor/library internals; prioritize admin, police, property, phone, and custom bcrp/srp commands. |
| Target interaction signals | 189 | Includes direct Ox target calls and compatibility wrappers. |
| SQL/import files | 27 | Database-dependent features need live DB validation. |
| Checklist rows created | 71 | Practical human test cases with pass/fail columns. |
| Estimated expanded test cases | 430-520 | If every shop location, job grade, usable item family, robbery, door, and multiplayer edge case is split into its own row. |
| Estimated requires 2+ players | 80-100 | Police, EMS, MDT, transfers, keys, synced emotes, sales, cuff/escort/jail, dispatch, property doorbell. |
| Estimated requires admin/setup | 45-60 | Job/grade changes, licenses, admin menus, door editor, property tools, DB verification, debug commands. |

## Resource Type Summary

| Type | Examples | QA posture |
|---|---|---|
| Core/vendor framework | `qbx_core`, `ox_lib`, `ox_inventory`, `ox_target`, `oxmysql`, `qbx_spawn`, `qbx_properties` | Regression test after framework updates; focus on load order, exports, DB persistence, permissions. |
| Vendor gameplay | `ps-dispatch`, `ps-mdt`, `Renewed-Banking`, `randol_medical`, `xt-prison`, `scully_emotemenu`, `it-drugs`, `wasabi_fishing`, `jim-boarding` | Test integration points with Qbox/Ox, jobs, inventory items, database tables, and phone/dispatch hooks. |
| Custom BCRP | `bcrp-roaming`, `bcrp-quest-hints`, `bcrp-recyclingbuyer`, `bcrp-propertytools`, `bcrp-admintools`, `bcrp-phone-directory`, `bcrp-blackmarket`, `bcrp-spotlight` | Highest custom regression risk; test after any config, dependency, or framework update. |
| Custom SRP | `srp-welcomehome`, `srp-rptools`, `srp-props`, `srp-vehiclecontrols`, `srp-arcade`, `srp-firescript` | Test item exports, target interactions, cleanup, multiplayer sync, and command permissions. |
| Config-only/map/vehicle packs | maps, ymaps, entitlements, vehicle packs, shell resources | Verify load/no missing assets, collision, doors/interiors, vehicle handling/spawn names, and resource ordering. |

## Highest Testing Priorities

1. **Startup/load order and database boot**
   Confirm `ox_lib`, `qbx_core`, `oxmysql`, `ox_inventory`, `ox_target`, NPWD, and custom resources start without missing export or SQL errors.

2. **Character creation, spawn, welcome, and property buckets**
   This is the first-player experience and touches `qbx_core`, `qbx_spawn`, `illenium-appearance`, `qbx_properties`, and `srp-welcomehome`.

3. **Permissions and exploit checks**
   Test wrong-job/off-duty/low-grade access for armouries, MDT, boss banking, police actions, admin menus, property tools, doors, and black market/fence interactions.

4. **Inventory, shops, and sell loops**
   Ox inventory is central. Prioritize General/Liquor/Loose Screw/Sporting/Ammunation, police/EMS armouries, `bcrp-recyclingbuyer`, `bcrp-quest-hints` fence sales, vending/business counters, and usable RP prop items.

5. **Police/EMS/dispatch/MDT/prison**
   These need live multiplayer: cuff, escort, jail, evidence, dispatch alerts, MDT records, EMS revive/treatment, prescriptions, and prison release/relog.

6. **Vehicles/economy**
   Test vehicle purchase/finance, keys, fuel, garages, impound/tow, vehicle sales, and police radar/ANPR. These are DB-heavy and prone to ownership/key desync.

7. **Custom BCRP/SRP resources**
   `bcrp-propertytools`, `bcrp-roaming`, `bcrp-quest-hints`, `bcrp-recyclingbuyer`, `srp-welcomehome`, `srp-rptools`, and `srp-vehiclecontrols` should get explicit tester signoff.

## Risk Flags / Follow-up Notes

- `local-resources.cfg` sets `ox_target:debug 1`; useful for QA, noisy for production.
- `server.cfg` ensures `[shell]` twice; verify no duplicate-start warnings or unintended restart ordering.
- `local.cfg` contains live-looking database and Steam API values; treat config handling as sensitive.
- `ox_doorlock` should be checked for actual persisted door data; quick file scan did not show obvious door data files under its data folder.
- Command registration count includes vendor internals; do not treat all 259 signals as player-facing commands without filtering.
- Shop count includes nested table false positives like `groups`/`model`; practical shop coverage should still test all real shop definitions and location groups.
- `qbx:enableVehiclePersistence` is false; testers should agree what vehicle state persistence is expected to do.
- Multiplayer-only flows must be tested on a live server, not solo localhost: cuff/escort/jail, key transfer, bank transfer, MDT/dispatch, synced emotes, property guests, vehicle sales, police flee behavior.
- Database-dependent features include characters, money, inventory, shops/stashes, properties, owned vehicles, banking, NPWD, MDT, prison, drugs/weed, vehicle shops/sales, and doorlocks if DB-backed.
- Likely-to-break-after-updates systems: Qbox/Ox exports, ox_inventory item metadata/useable item definitions, target API compatibility, NPWD apps, ps-dispatch/ps-mdt Qbox bridges, custom bcrp/srp resources, and any vendor resource with SQL/schema assumptions.

## Deliverables

- Import-ready checklist: `docs/bcrp_qa_testing_checklist.csv`
- This coverage report: `docs/bcrp_testing_coverage_report.md`
