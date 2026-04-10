#!/bin/bash

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null || echo "$TOOL_INPUT")

if echo "$COMMAND" | grep -qE '(rm\s+-rf|rm\s+-fr|sudo\s+rm)'; then
  echo "BLOCKED: Dangerous rm command detected"
  exit 1
fi

if echo "$COMMAND" | grep -qE 'curl\s+.*\|\s*(sh|bash)'; then
  echo "BLOCKED: Piped curl download detected"
  exit 1
fi

if echo "$COMMAND" | grep -qE 'wget\s+.*\|\s*sh'; then
  echo "BLOCKED: Piped wget download detected"
  exit 1
fi

if echo "$COMMAND" | grep -qE '>\s*/dev/'; then
  echo "BLOCKED: Device write detected"
  exit 1
fi

if echo "$COMMAND" | grep -qE '(mkfs|dd\s+if=)'; then
  echo "BLOCKED: Disk operation detected"
  exit 1
fi

exit 0
