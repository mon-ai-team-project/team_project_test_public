#!/usr/bin/env bash
set -euo pipefail
ROOT="/home/user/monaiteamproject/.worktrees/agent-traces"
cd "$ROOT/.mcp-servers/pptx-generator-mcp"
exec node mcp-server.js
