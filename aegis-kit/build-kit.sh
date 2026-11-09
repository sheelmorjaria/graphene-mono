#!/usr/bin/env bash
# Rebuild the Aegis installer kit: zipalign + sign a fresh engine build and
# repackage it with the setup docs.
#
#   ./build-kit.sh /path/to/app-release-unsigned.apk [/path/to/aegis-engine]
#
# Signs with ./aegis-release.keystore (created once; see README — back it up).
set -euo pipefail

APK_IN="${1:?usage: build-kit.sh <unsigned-release.apk> [engine-repo]}"
ENGINE="${2:-/home/sheel/~/graphene-mono/graphene-mono/aegis-engine-extract/aegis-engine}"
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Delivery dir: inside the backend build context so CapRover's image ships
# the artefacts (repo-root aegis-kit never enters the build context).
DELIVERY_DIR="$KIT_DIR/../apps/backend/aegis-kit"
BT="${ANDROID_BUILD_TOOLS:-$HOME/Android/Sdk/build-tools/36.0.0}"

[ -f "$APK_IN" ] || { echo "❌ APK not found: $APK_IN" >&2; exit 1; }
[ -f "$KIT_DIR/aegis-release.keystore" ] || { echo "❌ keystore missing — see README" >&2; exit 1; }
[ -x "$BT/zipalign" ] || { echo "❌ Android build-tools not found at $BT (set ANDROID_BUILD_TOOLS)" >&2; exit 1; }

PASS="$(cat "$KIT_DIR/.keystore-password")"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$BT/zipalign" -f 4 "$APK_IN" "$TMP/aligned.apk"
"$BT/apksigner" sign \
  --ks "$KIT_DIR/aegis-release.keystore" --ks-key-alias aegis \
  --ks-pass "pass:$PASS" --key-pass "pass:$PASS" \
  --out "$KIT_DIR/aegis-engine-signed.apk" "$TMP/aligned.apk"
"$BT/apksigner" verify "$KIT_DIR/aegis-engine-signed.apk"

STAGE="$TMP/aegis-installer-kit"
mkdir -p "$STAGE"
cp "$KIT_DIR/aegis-engine-signed.apk" "$STAGE/aegis-engine.apk"
cp "$ENGINE/README.md" "$STAGE/SETUP-GUIDE.md"
cp "$ENGINE/docs/PROVISIONING.md" "$ENGINE/docs/FEATURE-MAP.md" \
   "$ENGINE/docs/THREAT-MODEL.md" "$ENGINE/LICENSE-NOTES.md" "$STAGE/"
[ -f "$ENGINE/provision/provision.sh" ] && cp "$ENGINE/provision/provision.sh" "$STAGE/"

mkdir -p "$DELIVERY_DIR"
(cd "$TMP" && zip -qr "$DELIVERY_DIR/aegis-installer-kit.zip" aegis-installer-kit)
# Keep the signed APK beside the kit — the web installer streams this file
# (GET /api/aegis-orders/download/:token?file=apk).
cp "$KIT_DIR/aegis-engine-signed.apk" "$DELIVERY_DIR/aegis-engine.apk"
rm -f "$KIT_DIR/aegis-engine-signed.apk"

echo "✅ Kit rebuilt: $DELIVERY_DIR/aegis-installer-kit.zip ($(du -h "$DELIVERY_DIR/aegis-installer-kit.zip" | cut -f1)) + aegis-engine.apk"
echo "   Commit the two files in apps/backend/aegis-kit to ship them."
