# LaTeX And PPT MCP Setup

Updated: 2026-05-28 (codex)

This document records the conservative MCP plan for final paper and presentation production. Do not enable unverified MCP servers in the global client config until the runtime prerequisites are present.

## Decision

Use four separate roles:

| MCP candidate | Repository | Intended use | Current decision |
| --- | --- | --- | --- |
| LaTeX workspace MCP | `https://github.com/Yeok-c/latex-mcp-server` | Read `.tex` files, inspect bibliography, compile LaTeX, read generated PDFs | Preferred local LaTeX production MCP |
| arXiv LaTeX MCP | `https://github.com/takashiishida/arxiv-latex-mcp` | Inspect arXiv LaTeX source packages for reference and related-work assistance | Optional research-support MCP |
| PPTX Markdown Generator MCP | `https://github.com/dmytro-ustynov/pptx-generator-mcp` | Generate `.pptx` directly from Markdown slide content | Preferred presentation-generation MCP |
| PowerPoint Editing MCP | `https://github.com/GongRzhe/Office-PowerPoint-MCP-Server` | Generate and edit `.pptx` files through `python-pptx` | Fallback only; repository is archived, so use only after local smoke testing |

## Runtime Prerequisites

The current workspace previously lacked Python, pip, pipx-managed uv/uvx, and LaTeX binaries. `.idx/dev.nix` now requests:

```nix
pkgs.python311
pkgs.python311Packages.pip
pkgs.pipx
pkgs.texlive.combined.scheme-small
```

After the workspace restarts, verify:

```bash
command -v python3
command -v pip
command -v pipx
pipx install uv
command -v uv
command -v uvx
command -v pdflatex
```

If any command is missing, do not enable the MCP server yet.

## Recommended Local Install Flow

Clone MCP candidates outside the application runtime dependencies:

```bash
mkdir -p /home/user/mcp-servers
git clone https://github.com/Yeok-c/latex-mcp-server.git /home/user/mcp-servers/latex-mcp-server
git clone https://github.com/dmytro-ustynov/pptx-generator-mcp.git /home/user/mcp-servers/pptx-generator-mcp
git clone https://github.com/GongRzhe/Office-PowerPoint-MCP-Server.git /home/user/mcp-servers/office-powerpoint-mcp-server
git clone https://github.com/takashiishida/arxiv-latex-mcp.git /home/user/mcp-servers/arxiv-latex-mcp
```

Install the LaTeX MCP locally:

```bash
cd /home/user/mcp-servers/latex-mcp-server
uv tool install -e .
```

Smoke check:

```bash
latex-mcp-server --help
```

Install the preferred PPTX Markdown generator after Node dependencies are available:

```bash
cd /home/user/mcp-servers/pptx-generator-mcp
npm install
npm install -g .
which pptx-generator-mcp
```

Use `presentation/final-presentation-mcp.md` as the first PPTX input file.

Install the archived PowerPoint editing MCP only if direct PPTX editing is required and after confirming the package still resolves:

```bash
uvx --from office-powerpoint-mcp-server ppt_mcp_server --help
```

If either PPTX MCP install fails, keep using `presentation/final-presentation-outline.md` and `presentation/final-presentation-mcp.md` as source slide plans and generate PPTX through a later verified tool.

## Example MCP Client Entries

Use absolute paths. Replace `/home/user/monaiteamproject/.worktrees/agent-traces` if the active workspace differs.

```json
{
  "mcpServers": {
    "latex-paper": {
      "command": "latex-mcp-server",
      "args": [
        "--workspace",
        "/home/user/monaiteamproject/.worktrees/agent-traces/paper"
      ]
    },
    "pptx-generator": {
      "command": "pptx-generator-mcp",
      "args": []
    },
    "pptx-editor-fallback": {
      "command": "uvx",
      "args": [
        "--from",
        "office-powerpoint-mcp-server",
        "ppt_mcp_server"
      ]
    }
  }
}
```

Do not put placeholder paths into the client config. A stale or invalid path can block MCP startup for the whole client.

## Production Rule

- MCP configuration files must not contain secrets.
- Broken MCP entries must be removed or disabled immediately.
- LaTeX/PPT MCPs are optional production aids; the repository-native source files remain the source of truth.
- Final deliverables must still be reproducible from tracked files and documented commands.

## Applied Local Configuration

The current workspace has been configured with local, git-ignored MCP runtime directories:

- `.mcp-servers/latex-mcp-server`
- `.mcp-servers/pptx-generator-mcp`
- `.mcp-tools/`

The LaTeX MCP clone required two local-only `pyproject.toml` fixes before installation in this Nix environment:

- `setuptools>=61.0,<77` to avoid the newer license validation path that conflicts with the available packaging module.
- `license = { text = "MIT" }` to satisfy PEP 621 project metadata validation.

The verified Codex MCP wrappers are tracked in:

- `scripts/mcp/latex-paper.sh`
- `scripts/mcp/pptx-generator.sh`

The global Codex config has been updated to call those wrappers as `latex_paper` and `pptx_generator`. Restart Codex before expecting the new MCP tools to appear in the tool list.

## Generated Deliverables

- `paper/final-paper-draft.pdf` was generated from `paper/final-paper-draft.tex` with `pdflatex`.
- `presentation/generated/paper-agent-final-presentation.pptx` was generated from `presentation/final-presentation-mcp.md` using the PPTX generator code path.
