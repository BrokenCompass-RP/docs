---
title: BCRP HUD Phase 1 validation checklist
description: ''
default_visibility: developer
---
# BCRP HUD Phase 1 validation checklist

Phase 1 static validation is complete. The items below require a controlled
FiveM server/client parity session. Record tester, date, client resolution,
safe-zone setting, vehicle(s), and evidence for failures.

## Startup and exclusivity

- [ ] `bcrp-hud` starts without client or server errors
- [ ] Original `qbx_hud` is stopped
- [ ] No duplicate HUD is visible
- [ ] No duplicate minimap/radar control is observed
- [ ] No client console, server console, or NUI errors occur
- [ ] Configured/default locale loads every HUD string
- [ ] Czech locale is not selected until inherited `cs.json` is repaired and validated

## Player HUD

- [ ] Player HUD appears after player load
- [ ] Health updates
- [ ] Armor updates
- [ ] Hunger updates
- [ ] Thirst updates
- [ ] Stress updates
- [ ] Voice range updates
- [ ] Talking state updates
- [ ] Radio channel state updates

## Vehicle HUD

- [ ] Vehicle HUD appears on vehicle entry
- [ ] Seatbelt updates from restored `qbx_seatbelt`
- [ ] Harness state and durability display update
- [ ] Cruise state updates
- [ ] Fuel updates
- [ ] Engine value updates
- [ ] Altitude behavior is correct for aircraft
- [ ] Vehicle HUD hides/restores correctly on exit/re-entry

## Minimap and compass

- [ ] Minimap mask loads
- [ ] Minimap position is correct
- [ ] Square minimap mode works
- [ ] Circular minimap mode works
- [ ] Minimap border setting works
- [ ] Compass works
- [ ] Street names work

## Money and settings

- [ ] Cash popup works
- [ ] Bank popup works
- [ ] Money-change popup works
- [ ] Settings menu opens and closes
- [ ] Every settings control still invokes its callback
- [ ] Settings persist after resource restart
- [ ] Settings persist after reconnect
- [ ] Reset HUD and reset settings behave like upstream

## Visibility and lifecycle

- [ ] Spawn flow restores HUD and radar
- [ ] Inventory open/close behavior matches upstream
- [ ] Pause menu behavior is recorded, including known Phase 2 bug
- [ ] Death/laststand behavior is correct
- [ ] Appearance UI behavior is correct
- [ ] Police camera behavior is correct
- [ ] Resource restart restores correct state
- [ ] Reconnect restores correct state

## Performance

- [ ] No material on-foot performance regression versus `qbx_hud`
- [ ] No material driving performance regression versus `qbx_hud`
- [ ] Compass synchronized/optimized modes match upstream cost and behavior
- [ ] No extra long-running thread or repeated notification is observed

## Test record

| Field | Value |
|---|---|
| Tester | |
| Date | |
| Server build | |
| Client resolution/aspect ratio | |
| Safe-zone setting | |
| Vehicles tested | |
| Profiler/resmon evidence | |
| Console/NUI evidence | |
| Failures/backlog IDs | |
