#!/usr/bin/env bash
# eslint-fix-rules.sh
# Usage: ./eslint-fix-rules.sh <eslint-config-file>

set -euo pipefail

CONFIG="${1:-eslint.config.js}"

if [[ ! -f "$CONFIG" ]]; then
  echo "Config file not found: $CONFIG"
  exit 1
fi

ENABLE_COUNT=$(grep -c 'autofix-loop-enable' "$CONFIG" || true)
DISABLE_COUNT=$(grep -c 'autofix-loop-disable' "$CONFIG" || true)

if [[ "$ENABLE_COUNT" -ne 1 || "$DISABLE_COUNT" -ne 1 ]]; then
  echo "Error: config must contain exactly one '// autofix-loop-enable' and one '// autofix-loop-disable' comment."
  echo "  Found autofix-loop-enable: $ENABLE_COUNT"
  echo "  Found autofix-loop-disable: $DISABLE_COUNT"
  exit 1
fi

START_LINE=$(grep -n 'autofix-loop-enable' "$CONFIG" | cut -d: -f1)
END_LINE=$(grep -n 'autofix-loop-disable' "$CONFIG" | cut -d: -f1)

if [[ "$START_LINE" -ge "$END_LINE" ]]; then
  echo "Error: autofix-loop-enable (line $START_LINE) must precede autofix-loop-disable (line $END_LINE)."
  exit 1
fi

while true; do
  RULE=$(sed -n "${START_LINE},${END_LINE}p" "$CONFIG" \
    | grep -oP '["'"'"']\K[^"'"'"']+(?=["'"'"']\s*:\s*["'"'"']off["'"'"'])' \
    | head -1)

  if [[ -z "$RULE" ]]; then
    echo "✓ All rules processed."
    break
  fi

  echo "━━━ Enabling: $RULE ━━━"

  sed -i -E "${START_LINE},${END_LINE}{/[\"']${RULE//\//\\/}[\"']\s*:\s*[\"']off[\"'],?/d;}" "$CONFIG"

  # Recompute END_LINE as deletion shifts line numbers
  END_LINE=$(grep -n 'autofix-loop-disable' "$CONFIG" | cut -d: -f1)

  npx eslint . --fix --quiet
  npx tsc
  git add -A
  git commit -m "eslint: fix ${RULE}"
  echo "  ✓ Committed"
done
