#!/usr/bin/env bash

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
else
  COMMAND=$(printf '%s' "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
fi

if [ -z "${COMMAND:-}" ]; then
  exit 0
fi

NORMALIZED_COMMAND=$(printf '%s' "$COMMAND" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')

GIT_PREFIX='(^|[;&|[:space:]])git([[:space:]]+(-C|-c|--git-dir|--work-tree)[[:space:]]+[^[:space:]]+|[[:space:]]+-[A-Za-z][^[:space:]]*)*'

DANGEROUS_PATTERNS=(
  "$GIT_PREFIX[[:space:]]+push([[:space:]]|$)"
  "$GIT_PREFIX[[:space:]]+reset([^;&|]*)[[:space:]]+--hard([[:space:]]|$)"
  "$GIT_PREFIX[[:space:]]+clean([^;&|]*)(-[^[:space:]]*f|--force)([^;&|]*)"
  "$GIT_PREFIX[[:space:]]+branch([^;&|]*)[[:space:]]+-D([[:space:]]|$)"
  "$GIT_PREFIX[[:space:]]+(checkout|restore)([^;&|]*)[[:space:]]+--?[[:space:]]+\\.([[:space:]]|$)"
  "$GIT_PREFIX[[:space:]]+(checkout|restore)([^;&|]*)[[:space:]]+\\.([[:space:]]|$)"
  '(^|[;&|[:space:]])git([^;&|]*)[[:space:]]+push([^;&|]*)--force([[:space:]]|$)'
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if printf '%s\n' "$NORMALIZED_COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous git pattern. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
