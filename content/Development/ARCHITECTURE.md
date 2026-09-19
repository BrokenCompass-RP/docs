# Broken Compass RP — BCRP Architecture Guide

## Philosophy

Broken Compass RP is built around **small, focused resources** with clear ownership.

Each resource should have a single responsibility. Shared infrastructure belongs in infrastructure resources. Gameplay belongs in gameplay resources.

The goal is to make new systems easier to build without duplicating code or creating tightly coupled resources.

---

# Core Principles

## 1. Infrastructure vs Gameplay

Infrastructure answers:

* **Where?**
* **When?**
* **How?**

Gameplay answers:

* **What?**
* **Why?**

Infrastructure should never make gameplay decisions.

Gameplay should never reimplement infrastructure.

---

## 2. Configuration First

Every gameplay resource should be driven by configuration whenever practical.

Configuration should control things such as:

* NPC models
* Locations
* Timers
* Animations
* Dialogue
* Prices
* Rewards
* Inventory pools
* Police behavior
* Feature toggles

Changing gameplay should rarely require editing Lua.

---

## 3. Consumer Owns Behavior

Shared resources expose services.

Consumer resources decide how those services are used.

Example:

`bcrp-roaming`

Knows:

* spawn actors
* despawn actors
* move actors
* travel timers
* availability
* synchronization

Does **not** know:

* dialogue
* inventory
* quests
* selling
* rewards
* police logic
* economy

---

# Resource Responsibilities

## Shared Infrastructure: bcrp-roaming

`bcrp-roaming` is the first shared BCRP infrastructure resource.

It was introduced after `bcrp-quest-hints` proved the need for reusable roaming actor behavior and before `bcrp-blackmarket` duplicated the same movement/spawn lifecycle.

This establishes the core infrastructure rule:

* Shared resources provide generic lifecycle services.
* Gameplay resources decide why those services are used.
* Consumer resources keep their own configuration.
* Roaming knows **where** and **when**.
* Gameplay resources know **what** and **why**.

`bcrp-roaming` should remain focused. Do not add dialogue, inventory, rewards, police/job detection, heat systems, prices, quest state, or vendor rules to it. If a future resource needs those behaviors, they belong in that consumer resource or in a separate focused infrastructure resource after the pattern is proven.

## bcrp-roaming

Purpose:

Provides reusable roaming actor lifecycle.

Owns:

* actor registry
* movement
* travel cooldown
* no-repeat location selection
* availability state
* spawn/despawn lifecycle
* synchronization
* lifecycle exports/events

Never owns:

* dialogue
* inventories
* pricing
* rewards
* jobs
* police detection
* heat systems
* mission logic

---

## bcrp-quest-hints

Purpose:

Quest and information NPC gameplay.

Owns:

* dialogue
* hint generation
* fence selling
* rewards
* police flee decisions
* NPC-specific configuration

Uses:

`bcrp-roaming`

---

## Future: bcrp-blackmarket

Purpose:

Moving black market dealer.

Owns:

* inventory generation
* stock limits
* prices
* purchase validation
* heat behavior
* police response
* move-after-purchase rules

Uses:

`bcrp-roaming`

---

# Resource Communication

Prefer:

* exports
* ox_lib callbacks
* well-defined events

Avoid:

* reaching into another resource's local state
* duplicated helper functions
* duplicated movement logic

If two gameplay resources need the same functionality, consider extracting that functionality into a shared infrastructure resource.

---

# Configuration Ownership

Every gameplay resource owns its own configuration.

Example:

Quest Hints

* locations
* movement timing
* police radius
* dialogue
* rewards
* props
* vehicles

Black Market

* locations
* movement timing
* inventory pool
* pricing
* stock
* police behavior
* heat rules

Roaming should never contain gameplay configuration.

---

# Code Ownership

Before adding code to a resource, ask:

**Does this code make gameplay decisions?**

If yes:

It belongs in the gameplay resource.

**Does this code provide reusable infrastructure?**

If yes:

It may belong in a shared infrastructure resource.

---

# Duplication Rule

Copying code is acceptable once.

The second time is a warning.

The third time means it should probably become shared infrastructure.

Do not create shared libraries "just in case."

Extract only after a pattern has proven itself.

---

# Development Workflow

Every significant feature follows the same process.

1. Idea
2. Architecture review
3. Recommendation
4. Approval
5. Branch
6. Implementation
7. Review
8. Testing
9. Merge
10. Documentation

Avoid combining multiple architectural changes into a single branch.

---

# Resource Boundaries

A resource should be understandable in isolation.

When reading a resource, it should be obvious:

* what it owns
* what it exposes
* what it consumes
* what it intentionally does not do

If those boundaries become blurry, reconsider the design.

---

# Future Shared Infrastructure

Potential future shared resources include:

* Notification helpers
* Permission helpers
* Common validation
* Shared logging
* Utility exports

These should only be extracted after multiple gameplay resources genuinely require them.

Avoid creating a generic "utility" resource without a clear purpose.

---

# Design Goal

Build systems that are easy to reason about.

A future developer should be able to answer:

* Where is this behavior configured?
* Which resource owns this feature?
* Which resource provides the shared service?

without reading every resource in the project.

If the answer is obvious, the architecture is doing its job.
