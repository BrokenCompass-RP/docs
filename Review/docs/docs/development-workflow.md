# Broken Compass RP Development Workflow

## Why This Exists

This document captures lessons learned while introducing AI-assisted development (ChatGPT + Codex "Cody") into the Broken Compass RP workflow.

The goal is **not** to create unnecessary process. The goal is to protect the server while making development faster and more maintainable.

---

# Team Roles

## Deb (Project Lead)

Responsible for:

* Overall server vision
* Gameplay design
* Roleplay systems
* Feature prioritization
* Architecture decisions
* Final approval before deployment

Ask:

> Should we build this?

---

## ChatGPT (Architecture)

Primary responsibilities:

* System design
* Gameplay design
* Documentation
* Planning
* Reviewing architecture
* Brainstorming
* Challenging assumptions

Ask:

> Is this the right way to solve the problem?

---

## Cody (Codex)

Primary responsibilities:

* Reading the repository
* Branch reviews
* Code reviews
* Bug hunting
* Documentation generation
* Feature implementation
* Refactoring
* Git analysis

Ask:

> Did we build it correctly?

---

# Repository Documentation

Keep project documentation at the repository root.

Recommended structure:

```
docs/

    server-architecture.md

    development-workflow.md

    coding-standards.md

    vendor-patches.md

    resource-catalog.md

    roadmap.md

    gameplay-systems/

        apartments.md

        wallet.md

        electrician.md

        printshop.md
```

Resource-specific documentation belongs inside each resource as a `README.md`.

---

# Git Workflow

## Long-lived branches

```
main
```

Production.

Should always represent the code intended to run on the public server.

```
testing
```

Integration branch.

Used for multiplayer testing on the public server before merging to production.

---

## Feature branches

Examples:

```
feature/propertytools

feature/wallet

feature/printshop

feature/electrician

feature/phonedirectory
```

Feature branches are temporary.

Once merged they can be deleted.

---

# Recommended Workflow

1. Create a feature branch.

2. Build the feature.

3. Test locally whenever possible.

4. Ask Cody to review the branch.

Example prompt:

> Review this branch like the lead developer.
>
> Identify:
>
> • Bugs
> • Code smells
> • Merge risks
> • Vendor resource changes
> • Documentation updates
> • Technical debt

5. Merge into **testing**.

6. Deploy **testing** to the public server during a scheduled multiplayer testing session.

7. Verify multiplayer behavior.

Examples:

* routing buckets
* phone
* dispatch
* inventory
* ownership
* voice
* synchronization

8. If successful:

Merge **testing** into **main**.

---

# Current Reality

At present there is only **one** publicly accessible server.

Local development is done using Tailscale.

Some systems require multiple players and therefore cannot be fully tested locally.

Until additional infrastructure exists:

* The public server temporarily becomes the testing server during announced test windows.
* After testing, successful changes are merged into production.

This is an acceptable workflow for a solo developer.

---

# Cody Workflow

When beginning a new Cody conversation:

1. Read:

* docs/server-architecture.md
* docs/coding-standards.md
* docs/development-workflow.md

2. Understand the repository.

3. Do not modify vendor resources unless explicitly instructed.

4. Prefer creating or extending `bcrp-*` resources.

5. Explain architectural decisions before major changes.

---

# Vendor Resources

Whenever a vendor resource is modified:

Record it in:

```
docs/vendor-patches.md
```

Include:

* Resource name
* Files changed
* Why it was modified
* Date
* Any upstream merge concerns

This should prevent future updates from accidentally overwriting local fixes.

---

# Deployment Checklist

Before deploying to the public server:

* Git working tree is clean.
* Branch is correct.
* Cody has reviewed the branch.
* Database backup exists (if applicable).
* Deployment notes written.
* Rollback plan exists.

---

# Lessons Learned

* Build companion resources whenever possible instead of modifying Qbox directly.
* Documentation is part of the project, not an afterthought.
* AI is most valuable as a teammate, not an autopilot.
* Cody should review work before it reaches production.
* ChatGPT should help design systems before implementation begins.
* Small amounts of process save large amounts of future debugging.

---

# Philosophy

Broken Compass RP is not simply a collection of scripts.

It is a coherent roleplay world built from maintainable systems.

The goal is to create features that remain understandable, extensible, and update-safe long after they are first written.

Future Deb:

If you're reading this after a long break, welcome back. You probably forgot why you built something a certain way, and that's okay. Read the architecture docs, trust the process, let Cody reacquaint himself with the repository, and don't be afraid to ask ChatGPT to challenge the plan before writing code.

You've already done the hard part: building a foundation worth maintaining.
