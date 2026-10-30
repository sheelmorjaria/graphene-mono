# Aegis installer kit

This directory holds the artefacts served by the automated delivery flow
(`GET /api/aegis-orders/download/:token` in
`apps/backend/src/controllers/aegisOrderController.js`). Paid orders download
`aegis-installer-kit.zip` from here; replacing the file ships a new version to
every existing download link.

## Files

- `aegis-installer-kit.zip` — what customers download: the signed
  `aegis-engine.apk` plus the setup guide and docs.
- `aegis-release.keystore` + `.keystore-password` — the signing identity.
- `build-kit.sh` — rebuilds the kit from a fresh engine build.

## ⚠️ Back up the keystore

`aegis-release.keystore` is the permanent signing identity of the Aegis
engine. Every future release must be signed with the **same key** or
customers cannot install updates over their existing app. Store a copy
offline (password manager + encrypted backup). If it is lost, updates
require customers to uninstall first and re-provision.

The keystore and password are gitignored on purpose — they never leave this
machine except through your own backups.

## Rebuilding after an engine change

1. Build the engine (in the engine workspace):
   `./gradlew assembleRelease`
2. From this directory:
   `./build-kit.sh /path/to/aegis-engine/app/build/outputs/apk/release/app-release-unsigned.apk`
3. The zip is rebuilt in place; every paid order's link now serves the new
   version. Bump nothing — the endpoint streams whatever file is here.

Sign certificate fingerprint (SHA-256):
`27fef56ccaa791de8cdad0fbb2f5b1846511904a4538a9b45eb5e05b02e904fc`

## Serving in production

The backend serves the file at `AEGIS_KIT_PATH` (defaults to this repo
location). When the backend runs from a container image without the repo
layout, mount or copy the zip and set `AEGIS_KIT_PATH` to its absolute path.
