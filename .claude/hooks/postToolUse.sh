#!/bin/bash

if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // ""' 2>/dev/null || echo "$TOOL_INPUT")

if [[ "$FILE_PATH" != *.ts ]]; then
  exit 0
fi

if echo "$FILE_PATH" | grep -qE '(node_modules|dist)/'; then
  exit 0
fi

PROJECT_ROOT="/Users/suuuuuuminnnnn/Desktop/workspace/no-chu-be-nest-js"

cd "$PROJECT_ROOT" || exit 0

npm run lint -- --fix 2>&1 || echo "WARNING: lint failed"
npm run format 2>&1 || echo "WARNING: format failed"

exit 0
