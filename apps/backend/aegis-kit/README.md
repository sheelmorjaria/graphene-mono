# Aegis delivery artefacts (shipping directory)

`aegis-installer-kit.zip` and `aegis-engine.apk` live here — inside the
backend build context — so the CapRover image ships them and the download
endpoints (`/api/aegis-orders/download/:token`) can serve them at
`/app/aegis-kit` in the container.

Don't edit or place files here by hand: run `aegis-kit/build-kit.sh` from
the repo root, then commit the two refreshed files. Signing material
(keystore, password) stays in the gitignored repo-root `aegis-kit/` and
never enters this directory.
