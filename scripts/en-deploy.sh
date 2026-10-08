#!/usr/bin/env bash
# Deploy the English site (ideav.pro). Issue #526, epic #524. See docs/en-deploy.md.
#
#   EN_DEPLOY_HOST=host EN_DEPLOY_USER=user EN_DEPLOY_PATH=/var/www/ideav.pro \
#     bash scripts/en-deploy.sh [--dry-run] [--install] [--no-build]
#
# Release dir = dist-en/* + site-en/engine/* (without .env, tests, docker files).
# Uploaded with rsync over SSH; the server's .env and config files are never
# overwritten or deleted. Optional: EN_DEPLOY_SSH_PORT, EN_DEPLOY_SSH_KEY,
# EN_DEPLOY_PHP (default `php`).
set -euo pipefail

DRY=0; INSTALL=0; BUILD=1
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --install) INSTALL=1 ;;
    --no-build) BUILD=0 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown option: $a" >&2; exit 2 ;;
  esac
done

: "${EN_DEPLOY_HOST:?set EN_DEPLOY_HOST}"
: "${EN_DEPLOY_USER:?set EN_DEPLOY_USER}"
: "${EN_DEPLOY_PATH:?set EN_DEPLOY_PATH}"
case "$EN_DEPLOY_PATH" in /|""|/root|/home) echo "refusing unsafe EN_DEPLOY_PATH=$EN_DEPLOY_PATH" >&2; exit 2 ;; esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "$BUILD" = 1 ]; then npm run build:en; fi
[ -f dist-en/index.html ] || { echo "dist-en/index.html missing - build first" >&2; exit 1; }

RELEASE="$(mktemp -d)"
trap 'rm -rf "$RELEASE"' EXIT

# Same excludes as for the server: never ship secrets, tests or container files.
ENGINE_EXCLUDES=(
  --exclude='.env' --exclude='.env.*' --exclude='tests/' --exclude='test/'
  --exclude='docker-compose*.yml' --exclude='Dockerfile*' --exclude='.dockerignore'
  --exclude='.git/' --exclude='.gitignore' --exclude='node_modules/'
)
rsync -a dist-en/ "$RELEASE/"
if [ -d site-en/engine ]; then
  rsync -a "${ENGINE_EXCLUDES[@]}" site-en/engine/ "$RELEASE/"
else
  echo "WARN: site-en/engine/ not present - uploading the static site only" >&2
fi

# Final safety net before upload: Russian traces in the release dir stop the deploy.
if command -v node >/dev/null 2>&1; then
  node scripts/en-release-dir-check.mjs "$RELEASE"
fi

SSH=(ssh -o StrictHostKeyChecking=accept-new)
[ -n "${EN_DEPLOY_SSH_PORT:-}" ] && SSH+=(-p "$EN_DEPLOY_SSH_PORT")
[ -n "${EN_DEPLOY_SSH_KEY:-}" ] && SSH+=(-i "$EN_DEPLOY_SSH_KEY")

# Server-side files are kept: no --delete for these, they are also excluded from upload.
RSYNC=(rsync -rlptvz --delete
  --exclude='.env' --exclude='.env.*' --exclude='config.local.php' --exclude='config/local*'
  --exclude='uploads/' --exclude='storage/' --exclude='logs/' --exclude='*.log'
  -e "${SSH[*]}")
[ "$DRY" = 1 ] && RSYNC+=(--dry-run)

echo "==> rsync $RELEASE/ -> $EN_DEPLOY_USER@$EN_DEPLOY_HOST:$EN_DEPLOY_PATH/ $([ "$DRY" = 1 ] && echo '(dry run)')"
"${RSYNC[@]}" "$RELEASE/" "$EN_DEPLOY_USER@$EN_DEPLOY_HOST:$EN_DEPLOY_PATH/"

if [ "$INSTALL" = 1 ]; then
  if [ "$DRY" = 1 ]; then
    echo "==> (dry run) would run: cd $EN_DEPLOY_PATH && ${EN_DEPLOY_PHP:-php} install.php"
  else
    echo "==> running install.php on the server"
    "${SSH[@]}" "$EN_DEPLOY_USER@$EN_DEPLOY_HOST" "cd '$EN_DEPLOY_PATH' && ${EN_DEPLOY_PHP:-php} install.php"
  fi
fi
echo "==> done. Next: node scripts/en-release-audit.mjs https://ideav.pro"
