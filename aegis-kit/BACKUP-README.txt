AEGIS RELEASE KEYSTORE BACKUP
=============================

Contents:
  aegis-release.keystore  — the permanent signing identity of the Aegis
                            engine APK. Every future release MUST be signed
                            with this same key, or customers cannot install
                            updates over their existing app.
  .keystore-password      — the keystore password (also the key password,
                            alias: aegis)

To restore:
  1. Copy both files back into  <repo>/aegis-kit/
  2. Verify with:
       keytool -list -keystore aegis-release.keystore -storepass "$(cat .keystore-password)"
  3. Rebuild kits with aegis-kit/build-kit.sh as usual.

If this backup is lost AND the machine copy is lost, all future updates
require customers to uninstall first and re-provision their devices.

Signer certificate SHA-256:
27fef56ccaa791de8cdad0fbb2f5b1846511904a4538a9b45eb5e05b02e904fc
