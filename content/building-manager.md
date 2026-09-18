---
title: Broken Compass RP Building Manager guide
description: Apartments and offices are managed through one Building Manager and appear in Property Finder when published.
default_visibility: public
---

## Current status

The legacy `elevators_offices` resource has been replaced by the native office system in `bcrp-propertytools`. Apartments and offices are managed from one Building Manager. Office publication, revisions, Property Finder integration, custom Office Types, and unified interactions are live and tested.

## Property Finder

- Refresh Property Finder after creating, editing, publishing, or unpublishing listings.
- Office cards display the custom Office Type badge.
- Apartment cards continue to display leasing and availability information.
- Use the **Offices** filter to view office listings only.

:::access visibility="developer"
## Developer notes

- Apartment and office entrances use a shared `ox_target` interaction layer. The legacy apartment `E` interaction remains available as a rollback option.
- Optimistic concurrency protects all building mutations.
- Interior presets remain internal implementation details; office cards display the custom Office Type instead.

### Developer console

- `restart bcrp-propertytools` — Reload the Building Manager backend.
- `restart bcrp-phone-property-finder` — Reload NPWD Property Finder.
- `refresh` — Rescan resources.
- `ensure bcrp-propertytools` — Start the resource if stopped.

### Completion summary

- Revision contract repaired.
- Boolean normalization repaired.
- Office publication verified.
- Custom Office Type implemented end-to-end.
- Unified `ox_target` interactions implemented.
- Apartment creation restored and regression-tested.
- Building Manager authorization audited and enforced.
:::

:::access visibility="administrator"
## Administrator procedures

### Key changes

- The Building Manager is unified for apartments and offices.
- New office buildings are enabled and published by default unless explicitly created as unpublished or later unpublished.
- Property Finder supports both Apartments and Offices.
- Apartment creation has been restored and regression-tested.

### Creating an office

1. Open `/buildings` or `/buildingmanager`.
2. Choose **Create Building → Office**.
3. Enter the building information, Office Type, entrance, interior preset, and floor count.
4. Complete creation. New offices publish automatically by default.
5. Refresh Property Finder if the listing is not immediately visible.

### Managing buildings

| Action | Description |
| --- | --- |
| Overview | Shows building ID, type, revision, status, and configured spaces. |
| Edit General | Updates approved building fields, including Office Type. |
| Enable / Disable | Controls whether the building is active. |
| Show / Hide in Property Finder | Publishes or unpublishes listings. |
| Floors | Manages office floors and access. |
| Audit History | Reviews administrative changes. |
| Archive Office | Archives an office when unoccupied. |

### Security

Building Manager is server-authoritative. Both commands and every administrative callback perform an ACE authorization check using the `bcrp.propertytools` permission. Unauthorized users cannot open the manager or invoke administrative operations.
:::
