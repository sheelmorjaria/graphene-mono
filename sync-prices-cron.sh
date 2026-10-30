#!/usr/bin/env bash
# Daily supplier (CeX) price sync, run by sheel's crontab.
#
#   17 5 * * * /home/sheel/~/graphene-mono/graphene-mono/sync-prices-cron.sh
#
# Applies price + stock changes to the production DB (the MONGODB_URI in
# apps/backend/.env). Output is appended to logs/price-sync.log, which is
# trimmed to the last 5000 lines each run.
set -u

REPO_DIR='/home/sheel/~/graphene-mono/graphene-mono'
NODE_BIN='/home/sheel/.local/nodejs/bin/node'
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/price-sync.log"

mkdir -p "$LOG_DIR"
log() { echo "$*" >> "$LOG_FILE"; }

log ""
log "===== $(date '+%Y-%m-%d %H:%M:%S %Z') price sync ====="

# Guard: dotenv loads root .env, then falls back to apps/backend/.env
if ! grep -Eq '^MONGODB_URI=\S' "$REPO_DIR/.env" "$REPO_DIR/apps/backend/.env" 2>/dev/null; then
  log "SKIPPED: MONGODB_URI is not set in .env or apps/backend/.env"
  exit 1
fi

cd "$REPO_DIR" || { log "FAILED: cannot cd $REPO_DIR"; exit 1; }

"$NODE_BIN" "$REPO_DIR/syncFromCLI.js" prices --confirm >> "$LOG_FILE" 2>&1
exit_code=$?

if [ "$exit_code" -ne 0 ]; then
  log "FAILED: price sync exited with code $exit_code"
else
  log "OK: price sync completed"
fi

# Trim log to the last 5000 lines
tail -n 5000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
exit "$exit_code"
