#!/usr/bin/env bash
set -euo pipefail
ROOT="/home/user/monaiteamproject/.worktrees/agent-traces"
cd "$ROOT"
export PATH="/home/user/.local/bin:$ROOT/.mcp-tools/bin:$PATH"
exec nix-shell -p python311 python311Packages.pip pipx texlive.combined.scheme-small --run "PATH=/home/user/.local/bin:$ROOT/.mcp-tools/bin:\$PATH latex-mcp-server --workspace $ROOT/paper"
