#!/usr/bin/env bash

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: 'jq' is required but not installed. Cannot verify git guardrails." >&2
  exit 2
fi

INPUT=$(cat)

if ! COMMAND=$(printf '%s' "$INPUT" | jq -er '.tool_input.command | strings' 2>/dev/null); then
  echo "ERROR: Failed to parse tool input command. Cannot verify git guardrails." >&2
  exit 2
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
    printf "BLOCKED: '%s' matches dangerous git pattern. The user has prevented you from doing this.\n" "$COMMAND" >&2
    exit 2
  fi
done

exit 0
