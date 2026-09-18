# Broken Compass RP Coding Standards

## Purpose

These standards exist to keep Broken Compass RP maintainable, update-safe, and understandable.

The goal is not perfection.

The goal is to avoid cursed swamp code.

---

# Core Principles

## 1. Prefer Companion Resources

Do not modify vendor resources unless there is a clear reason.

Prefer creating or extending custom resources under:

```text
resources/[bcrp]/
```

Examples:

```text
bcrp-propertytools
bcrp-wallet
bcrp-printshop
bcrp-electrician
```

Use companion resources to add behavior around Qbox, Ox, NPWD, and other systems.

---

## 2. Protect Vendor Updates

Vendor resources include:

* Qbox resources
* Ox resources
* NPWD resources
* Voice/radio resources
* Paid/escrowed assets
* Map/interior resources
* Vehicle packs
* Third-party standalone scripts

If a vendor resource must be modified:

1. Keep the change as small as possible.
2. Document it in `docs/vendor-patches.md`.
3. Explain why a companion resource was not enough.
4. Note upstream merge risks.

---

## 3. Keep Configuration Separate From Logic

Use config files for values that may change.

Examples:

* coordinates
* item names
* prices
* job names
* allowed roles
* cooldowns
* labels
* blip settings
* target zones
* reward ranges

Avoid hardcoding server-specific values inside core logic.

---

## 4. Favor Readability Over Cleverness

Code should be boring, clear, and easy to debug.

Prefer:

```lua
if not player then
    return
end
```

over clever one-liners that require a tiny wizard hat to understand.

---

# Resource Structure

A typical BCRP resource should look like:

```text
bcrp-example/
    fxmanifest.lua
    README.md
    shared/
        config.lua
    client/
        main.lua
    server/
        main.lua
```

Use only the folders needed by the resource.

For NUI resources:

```text
bcrp-example/
    fxmanifest.lua
    README.md
    shared/
        config.lua
    client/
        main.lua
    server/
        main.lua
    web/
        src/
        dist/
        package.json
        package-lock.json
```

Do not commit:

```text
web/node_modules/
```

---

# Naming Standards

## Resources

Custom resources use the `bcrp-` prefix.

Good:

```text
bcrp-propertytools
bcrp-phone-directory
bcrp-wallet
```

Avoid mixing legacy prefixes unless intentionally preserving compatibility.

If old event names use `srp-*`, document why.

---

## Files

Use simple, predictable file names.

Good:

```text
config.lua
main.lua
permissions.lua
client.lua
server.lua
```

Avoid mystery names like:

```text
stuff.lua
newmain.lua
final2.lua
```

Future Deb does not deserve that nonsense.

---

## Events

Use namespaced event names.

Good:

```lua
bcrp-wallet:server:openWallet
bcrp-wallet:client:syncWallet
bcrp-propertytools:server:createApartmentBuilding
```

Avoid generic names:

```lua
openMenu
sync
update
```

---

## Callbacks

Use clear callback names.

```lua
lib.callback.register('bcrp-example:server:getConfig', function(source)
    return Config
end)
```

Client usage:

```lua
local config = lib.callback.await('bcrp-example:server:getConfig', false)
```

---

# Lua Standards

## Validate Before Use

Always validate nested values before indexing them.

Prefer:

```lua
local shop = sharedConfig.shops and sharedConfig.shops[shopName]
if not shop then
    return
end

local vehicle = shop.showroomVehicles and shop.showroomVehicles[targetVehicle]
if not vehicle then
    return
end
```

Avoid:

```lua
local vehicle = sharedConfig.shops[shopName].showroomVehicles[targetVehicle]
```

That is how nil errors sneak in wearing a tiny fake mustache.

---

## Guard Clauses

Use early returns to keep code readable.

```lua
if not source then return end
if not player then return end
if not item then return end
```

---

## Server Authority

The server should validate anything important.

Do not trust the client for:

* money
* inventory
* job permissions
* distance checks
* ownership
* item counts
* player state
* cooldowns

The client can request.

The server decides.

---

## Distance Checks

Any action that depends on location should validate distance server-side when possible.

Example:

```lua
local ped = GetPlayerPed(source)
local coords = GetEntityCoords(ped)

if #(coords - targetCoords) > Config.MaxDistance then
    return
end
```

---

## Permissions

Use clear permission checks.

Acceptable patterns:

* ACE permissions
* Qbox permissions
* job checks
* grade checks
* configured identifier allowlists

Document which one a resource uses.

---

# Config Standards

Configs should be readable by someone who is not deep in the code.

Good:

```lua
Config.PrintFee = 25

Config.AllowedJobs = {
    police = true,
    ambulance = true,
}
```

Avoid:

```lua
Config.X = 25
Config.Y = { p = true, a = true }
```

---

## Coordinates

Use consistent coordinate types.

Preferred:

```lua
vec3(x, y, z)
vec4(x, y, z, heading)
```

Do not mix strings, tables, and vectors unless the resource specifically requires it.

---

## Item Lists

Use allowlist tables for item restrictions.

```lua
Config.WalletItems = {
    id_card = true,
    driver_license = true,
    cash = true,
    business_card = true,
}
```

---

# Ox / Qbox Standards

Use `ox_lib` where appropriate for:

* callbacks
* notifications
* context menus
* input dialogs
* progress bars
* points/zones

Use `ox_target` for player interactions unless a resource has a specific reason not to.

Use `ox_inventory` for inventory operations.

Use `oxmysql` for database operations.

Use Qbox player APIs for player lookup, jobs, metadata, and permissions.

---

# Database Standards

Ask before changing database schemas.

Any schema change should include:

* purpose
* migration SQL
* rollback notes if practical
* affected resources
* whether live data needs migration

Do not silently change player, inventory, property, garage, or economy tables.

---

# Frontend / NUI Standards

Frontend resources should commit:

```text
web/src/
web/dist/
web/package.json
web/package-lock.json
```

Do not commit:

```text
web/node_modules/
```

Clean stale build artifacts before merging.

If `remoteEntry.js` or another manifest points to current bundles, remove old duplicate bundles unless the build system intentionally keeps them.

Frontend callbacks should handle failure states when practical.

---

# Documentation Standards

Every custom BCRP resource should include a `README.md`.

The README should explain:

* what the resource does
* dependencies
* commands
* permissions
* config options
* events
* exports
* install notes
* known limitations

Project-level docs belong in:

```text
docs/
```

Resource-level docs belong inside the resource.

---

# Branch Review Standards

Before merging a branch, ask Cody to review it.

Review should include:

* summary of changes
* resources modified
* vendor resources modified
* bugs
* merge risks
* database changes
* config changes
* documentation updates needed
* player experience impact
* deployment checklist

---

# Deployment Standards

Before pushing to live:

1. Confirm correct branch.
2. Confirm clean working tree.
3. Review changed resources.
4. Back up database if needed.
5. Restart only required resources when possible.
6. Watch console for errors.
7. Test the feature in-game.
8. Document any follow-up fixes.

---

# Live Testing

Because there is currently one public-access server, the live server may temporarily act as the test server during announced testing windows.

Use the `testing` branch for multiplayer testing when local testing is insufficient.

Local testing is good for:

* syntax
* loading resources
* UI basics
* single-player interactions

Live/multiplayer testing is needed for:

* routing buckets
* voice/radio
* phone apps
* inventory sync
* property ownership
* garage behavior
* dispatch/MDT
* multi-player state

---

# What Not To Do

Do not:

* commit `node_modules`
* commit secrets
* commit local config
* commit database dumps unless intentionally documented
* make broad rewrites without approval
* edit vendor code casually
* trust client-side validation
* merge large changes without review
* hide gameplay balance changes inside vendor configs without documenting them

---

# Final Rule

Leave the codebase easier to understand than you found it.

If a change works but makes Future Deb suffer, it is not done.
