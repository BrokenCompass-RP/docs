---
title: BCRP CSI Evidence Photo Deployment
description: ''
default_visibility: developer
---
# BCRP CSI Evidence Photo Deployment

## Scope and authoritative flow

CSI Camera capture creates one private `bcrp-media` asset and one temporary `bcrp_forensic_photos` row. Printing creates independent `bcrp_print_jobs` / `bcrp_print_copies` records and non-stackable `printed_photo` items that all reference the same durable `assetUuid`; printing does not copy the R2 object.

A physical copy may be used to attach that asset to a stable `mdt_reports.id`. The durable relationship is `bcrp_forensic_photo_links(asset_uuid, 'mdt_report', target_id)`. The tooltip is a snapshot on the one physical copy used and is never authorization data. MDT report display resolves links through bcrp-forensics and generates fresh signed view URLs through bcrp-media.

## A. SQL migration order

Back up the database and verify each schema before applying anything.

1. `[bcrp]/bcrp-forensics/sql/006_add_forensic_photos.sql`
   - Creates `bcrp_forensic_photos` with durable asset identity, classification, capture owner/time, retention, and deletion state.
   - `CREATE TABLE IF NOT EXISTS` is safe to rerun, but it does not repair a partially incompatible table.
2. `[bcrp]/bcrp-forensics/sql/007_photo_expiration.sql`
   - Changes new-photo retention default to `0`; adds `expires_at` and `expired_at`; backfills expiry.
   - Not safely rerunnable because its `ALTER TABLE ... ADD COLUMN` has no conditional guard.
3. `[bcrp]/bcrp-printshop/sql/003_add_photo_prints.sql`
   - Makes document references nullable and adds `print_kind`, `asset_uuid`, and `media_class` to print jobs/copies plus the copy asset index.
   - Not safely rerunnable because its column/index additions have no conditional guards.
4. `[bcrp]/bcrp-forensics/sql/008_add_forensic_photo_links.sql`
   - Creates the durable polymorphic photo-link table and unique `(asset_uuid, target_type, target_id)` key.
   - `CREATE TABLE IF NOT EXISTS` is safe to rerun, but verify the existing table has the expected keys and foreign key.
5. `[bcrp]/bcrp-forensics/sql/009_add_locker_item_custody.sql`
   - Creates the generic physical locker deposit/retrieval audit ledger without requiring a forensic evidence UUID.
   - `CREATE TABLE IF NOT EXISTS` is safe to rerun, but verify its JSON metadata column and custody indexes.

Dev application state was not queried during the QA pass: MySQL was running, but no database client was available to the session. Verify read-only before deployment:

```sql
SHOW CREATE TABLE bcrp_forensic_photos;
SHOW COLUMNS FROM bcrp_forensic_photos;
SHOW CREATE TABLE bcrp_print_jobs;
SHOW CREATE TABLE bcrp_print_copies;
SHOW CREATE TABLE bcrp_forensic_photo_links;
SHOW CREATE TABLE bcrp_forensic_locker_custody;

SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('bcrp_forensic_photos','bcrp_print_jobs','bcrp_print_copies','bcrp_forensic_photo_links','bcrp_forensic_locker_custody')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

Lifecycle verification queries:

```sql
SELECT asset_uuid, retained, captured_at, expires_at, expired_at, deleted_at
FROM bcrp_forensic_photos ORDER BY id DESC LIMIT 20;

SELECT id, print_job_id, asset_uuid, print_kind, voided_at
FROM bcrp_print_copies WHERE print_kind = 'photo' ORDER BY id DESC LIMIT 20;

SELECT asset_uuid, target_type, target_id, attached_by_citizenid, attached_at
FROM bcrp_forensic_photo_links ORDER BY id DESC LIMIT 20;

SELECT action, actor_citizenid, item_name, item_count, item_metadata,
       from_inventory, from_slot, to_inventory, to_slot, locker_id, occurred_at
FROM bcrp_forensic_locker_custody ORDER BY id DESC LIMIT 40;
```

## B. Resource files

- `bcrp-media`: generic screenshot processing, upload/confirmation, private signed views, preview actions, Worker API.
- `bcrp-forensics`: CSI camera, temporary lifecycle, retention, delete/expiry, print provider, report associations and report presentation.
- `bcrp-printshop`: Photos UI, authoritative print records, physical item delivery/use, report selector, slot metadata snapshot.
- `ps-mdt`: restricted report search/access validation and report-level Forensic Photos display.
- `ox_inventory`: `printed_photo` item and icon.

## C. Vendor/update-sensitive files

Reapply and rebuild after ps-mdt vendor updates:

- `[standalone]/ps-mdt/server/backend/reports.lua`
- `[standalone]/ps-mdt/client/backend/reports.lua`
- `[standalone]/ps-mdt/web/src/constants/nuiEvents.ts`
- `[standalone]/ps-mdt/web/src/pages/ReportEditor.svelte`
- `[standalone]/ps-mdt/web/src/components/report-editor/ForensicPhotos.svelte`
- `[standalone]/ps-mdt/web/dist/index.html`
- generated `[standalone]/ps-mdt/web/dist/assets/index-*.js`
- generated `[standalone]/ps-mdt/web/dist/assets/index-*.css`

Ox Inventory update-sensitive deployment files:

- `[ox]/ox_inventory/data/items.lua`
- `[ox]/ox_inventory/web/images/printed_photo.png`

The item key must occur exactly once, remain `stack = false`, `consume = 0`, and keep `client.export = 'bcrp-printshop.usePrintedPhoto'`.

## D. Cloudflare Worker

Committed Worker configuration:

- Worker name: `bcrp-media-api`
- R2 binding: `MEDIA_BUCKET`
- Bucket: `bcrp-media`
- Allowed upload origins: `https://cfx-nui-bcrp-printshop`, `https://cfx-nui-bcrp-media`
- Required secrets: `BCRP_SERVER_SECRET`, `UPLOAD_TOKEN_SECRET`
- The FXServer server-only media secret must match the Worker `BCRP_SERVER_SECRET`.

The deployed Worker version, deployed variable values, binding health, and secret presence cannot be proven from committed files. Confirm them in Cloudflare. Remove `DEVELOPMENT_ORIGIN` from production if unused. Never use wildcard CORS or place secrets in Lua/NUI/source control.

Worker verification:

```text
GET /health
Create one upload session
PUT from cfx-nui-bcrp-media
Confirm asset becomes verified
Create and fetch a signed private view URL
```

## E. Start and restart order

Manifest dependency order:

1. `oxmysql`, `ox_lib`, `qbx_core`
2. `ox_inventory`, `screenshot-basic`, `ps_lib`
3. `bcrp-media` (explicitly depends on screenshot-basic)
4. `bcrp-printshop` (depends on bcrp-media)
5. `ps-mdt`
6. `bcrp-forensics` (depends on Ox Inventory, bcrp-media, and bcrp-printshop)

The current server config starts `[standalone]` before explicit `bcrp-forensics`, then `[bcrp]`; FiveM dependency resolution starts media/printshop as needed. ps-mdt and printshop integration is runtime-guarded rather than declared cross-resource dependencies, avoiding a circular manifest dependency. For a controlled restart use:

```text
restart bcrp-media
restart bcrp-printshop
restart ps-mdt
restart bcrp-forensics
```

Then reopen affected UI. Do not restart during an in-flight capture/upload/print.

## F. Post-deploy smoke test

- Capture one CSI photo; confirm a countdown badge and verified media asset.
- Confirm a zero-photo character has no Printshop Photos tab.
- Print two copies of the same source. Confirm distinct `printId` values, identical `assetUuid`, and no second media asset.
- Attach only one copy to Report #4. Confirm only its tooltip changes to `Report: #4`.
- Open both physical copies and confirm the same image.
- Attach the same copy/report again; confirm “already attached” and one link/thumbnail.
- Attach the source to another accessible report; confirm a second distinct target link.
- Transfer, move, drop/pick up, container-store/retrieve, and evidence-locker-store/retrieve the item. Confirm metadata and viewing survive.
- With the receiving authorized officer, confirm item viewing works but library/report access remains governed by their own permissions.
- Open Report #4, open its thumbnail, close/reopen, and confirm fresh signed access.
- Confirm a zero-link report has no Forensic Photos section.
- Simulate expiration on an unretained test asset and restart bcrp-forensics; confirm it disappears and is purged/tombstoned.
- Confirm a printed retained photo survives the same expiry window and cleanup.
- Delete an unretained photo; confirm immediate provider disappearance and storage purge. Confirm retained photos reject deletion.

### Evidence locker support

The named evidence locker uses Ox's native `policeevidence` inventory and accepts normal transferable items, including a
loose `printed_photo`. Ox preserves the physical item's complete metadata; locker storage does not alter photo retention,
print records, media ownership, or MDT links. `bcrp-forensics` re-authorizes each transfer and writes generic deposit and
retrieval snapshots to `bcrp_forensic_locker_custody`. Apply `009_add_locker_item_custody.sql` before deploying this code,
then runtime-test a report-assigned print through store, restart, retrieval, and preview. The separate `Manage Evidence
Bags` batch menu remains bag-only because it also performs forensic evidence lifecycle transitions.

## G. Expected database transitions

Fresh capture:

```text
bcrp_media_assets.status = verified
bcrp_forensic_photos.retained = 0
expires_at = captured_at + configured temporary window
deleted_at = NULL
```

Successful print:

```text
new completed bcrp_print_jobs row
new non-voided bcrp_print_copies row
bcrp_forensic_photos.retained = 1
physical printed_photo delivered
```

Successful report attachment:

```text
INSERT IGNORE bcrp_forensic_photo_links(asset_uuid, 'mdt_report', mdt_reports.id, officer)
retention unchanged at 1
only the used item slot receives reportId/reportDisplay snapshot
```

Expiration/manual deletion of an unretained photo:

```text
deleted_at set
expired_at set for expiry cleanup
bcrp-media PurgeAsset requested
forensic row remains as lightweight lifecycle/tombstone data
```

## H. Rollback

1. Stop new captures/prints and take a database backup.
2. Roll back resource code and the ps-mdt generated bundle together; do not mix source and old hashes.
3. Keep media objects and forensic/print/link tables during code rollback so physical items and links remain recoverable.
4. Do not drop migration tables or columns as an emergency rollback.
5. If the Worker deployment is faulty, restore the last known Worker version and matching server secret/config; do not make the bucket public.
6. If ps-mdt display must be disabled, remove the UI/callback bridge only; preserve `bcrp_forensic_photo_links`.
7. Verify existing physical prints still open before reopening capture/printing.

## Pre-live sign-off

- [ ] Database schema verified; only missing migrations applied in order.
- [ ] `009_add_locker_item_custody.sql` applied and generic locker deposit/retrieval rows verified.
- [ ] Worker deployment/version, R2 binding, allowed origins, and secrets verified.
- [ ] Resource ordering confirmed in the live config.
- [ ] ps-mdt source and generated assets deployed together.
- [ ] Ox item and icon deployed and protected from vendor overwrite.
- [ ] Full two-player transfer/authorization test passed.
- [ ] Slot/drop/container/evidence-locker test passed.
- [ ] Expiry, delete, retained survival, restart, duplicate attach, and zero-state tests passed.
- [ ] Database rows and R2 object counts checked during smoke testing.
