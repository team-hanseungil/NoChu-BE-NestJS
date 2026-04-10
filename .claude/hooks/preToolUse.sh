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

if echo "$COMMAND" | grep -qE '^git\s+commit'; then
  SENTINEL="/tmp/.claude_commit_ok"
  if [ -f "$SENTINEL" ]; then
    rm -f "$SENTINEL"
    exit 0
  else
    echo '{"continue": false, "stopReason": "/commit 스킬 없이는 커밋할 수 없습니다. 사용자에게 /commit 스킬 사용을 요청하세요."}'
    exit 0
  fi
fi

exit 0
