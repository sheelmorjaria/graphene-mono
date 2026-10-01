#!/usr/bin/env bash
# Daily CeX price/stock sync, run by cron. Applies supplier repricing to the
# PROD MongoDB (env from apps/backend/.env) and appends an audit log to
# logs/price-sync.log (gitignored). flock guards against overlapping runs.
#
# Manual use:
#   scripts/daily-price-sync.sh            # run now
#   tail -f logs/price-sync.log            # watch
#
# NOTE: this updates the DB only — prerendered product HTML keeps old prices
# until the next frontend deploy, and IndexNow pings do NOT fire from script
# updates (search engines re-crawl on their own schedule).
set -euo pipefail

REPO="/home/sheel/graphene-mono"
LOG_DIR="$REPO/logs"
LOG="$LOG_DIR/price-sync.log"
NODE_BIN="/usr/bin/node"

mkdir -p "$LOG_DIR"
echo "===== $(date -u '+%Y-%m-%d %H:%M:%SZ') =====" >> "$LOG"

# Skip if a previous run is still going (17 CLI queries + DB writes can take
# a few minutes).
exec 9>"$LOG_DIR/price-sync.lock"
if ! flock -n 9; then
  echo "another sync is already running — skipped" >> "$LOG"
  exit 0
fi

cd "$REPO"
"$NODE_BIN" syncFromCLI.js prices --confirm >> "$LOG" 2>&1
echo "" >> "$LOG"
