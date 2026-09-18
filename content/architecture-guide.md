---
title: BCRP Architecture Guide
description: Engineering principles for resource ownership, configuration, and shared infrastructure.
default_visibility: developer
---

# Broken Compass RP architecture

## Philosophy

Broken Compass RP uses small, focused resources with clear ownership. Shared infrastructure belongs in infrastructure resources, while gameplay decisions belong in gameplay resources.

## Configuration first

Gameplay resources should be driven by configuration whenever practical. Configuration controls NPC models, locations, timers, animations, dialogue, prices, rewards, inventory pools, police behavior, and feature toggles. Changing gameplay should rarely require editing Lua.

## Consumer owns behavior

Shared resources expose services. Consumer resources decide how those services are used. `bcrp-roaming` owns actor registration, movement, travel cooldowns, availability, synchronization, and spawn or despawn lifecycle. It does not own dialogue, inventories, pricing, rewards, jobs, police detection, heat systems, or mission logic.

## Resource communication

Prefer exports, `ox_lib` callbacks, and well-defined events. Avoid reaching into another resource's local state or duplicating movement and helper logic.

## Duplication rule

Copying code is acceptable once. The second time is a warning. The third time means the behavior should probably become shared infrastructure. Extract a shared resource only after the pattern has proven itself.

## Development workflow

Significant features move through idea, architecture review, recommendation, approval, branch, implementation, review, testing, merge, and documentation. Avoid combining multiple architectural changes in one branch.

## Design goal

A future developer should be able to identify where behavior is configured, which resource owns a feature, and which resource provides a shared service without reading every resource in the project.
