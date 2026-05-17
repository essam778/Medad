#!/usr/bin/env bash
set -euo pipefail

# === Configuration ===
# Set these environment variables before running:
#   DATABASE_URL    — Supabase direct connection string
#   BACKUP_REPO_URL — full URL of the private backup repo (org/repo or user/repo)
#
# Optional:
#   BACKUP_DIR      — where to clone the backup repo (default: /tmp/backup-repo)

DATE=$(date +%Y-%m-%d)
BACKUP_FILE="backup-${DATE}.sql"
BACKUP_DIR="${BACKUP_DIR:-/tmp/backup-repo}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo "Usage: DATABASE_URL='postgresql://...' BACKUP_REPO_URL='org/repo' ./scripts/backup-db.sh"
  exit 1
fi

if [ -z "${BACKUP_REPO_URL:-}" ]; then
  echo "ERROR: BACKUP_REPO_URL is not set"
  echo "Usage: DATABASE_URL='postgresql://...' BACKUP_REPO_URL='org/repo' ./scripts/backup-db.sh"
  exit 1
fi

echo "==> Dumping database to ${BACKUP_FILE}"
pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}"

echo "==> Compressing"
gzip "${BACKUP_FILE}"

echo "==> Cloning backup repo ${BACKUP_REPO_URL} into ${BACKUP_DIR}"
rm -rf "${BACKUP_DIR}"
git clone "https://github.com/${BACKUP_REPO_URL}.git" "${BACKUP_DIR}"

echo "==> Copying backup"
cp "${BACKUP_FILE}.gz" "${BACKUP_DIR}/"

echo "==> Committing and pushing"
cd "${BACKUP_DIR}"
git config user.name "backup-bot"
git config user.email "backup-bot@users.noreply.github.com"
git add "${BACKUP_FILE}.gz"
git commit -m "backup: ${DATE}"
git push

echo "==> Done"
