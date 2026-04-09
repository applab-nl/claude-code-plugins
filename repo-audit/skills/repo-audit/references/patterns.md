# Threat Pattern Catalog

Reference patterns for each audit phase. Use these as grep/glob targets during the audit.

---

## Phase 1: Metadata Red Flags

Check with `gh` CLI (skip if unavailable):
```bash
gh repo view --json name,stargazerCount,forkCount,createdAt,pushedAt,licenseInfo,description,owner
gh api repos/{owner}/{repo}/contributors --jq 'length'
```

Red flags:
- Created very recently (< 30 days) with suspiciously high stars
- Single contributor
- No license
- Description contains urgency language ("MUST use", "run immediately")
- Fork of a popular repo with minimal changes (supply chain impersonation)

---

## Phase 2: Agent/AI Prompt Injection

### Files to scan

```
CLAUDE.md
.claude/settings.json
.claude/settings.local.json
.claude/commands/**
AGENTS.md
.cursorrules
.cursor/**
.github/copilot-instructions.md
.windsurfrules
.aider*
.continue/**
.vscode/settings.json
.devcontainer/**
mcp.json
claude_desktop_config.json
.mcp.json
```

### Injection patterns (grep)

```
# Hidden instructions in markdown/comments
(?i)(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)
(?i)you\s+are\s+now\s+in\s+
(?i)new\s+instructions?\s*:
(?i)system\s*:\s*you
(?i)override\s+(previous|all|default)\s+(instructions|behavior|rules)
(?i)<\s*system[_-]?(prompt|instruction|message)\s*>
(?i)IMPORTANT:.*(?:ignore|override|disregard)

# Hidden text (zero-width chars, HTML comments, invisible unicode)
\xe2\x80\x8b    # zero-width space
\xe2\x80\x8c    # zero-width non-joiner
\xe2\x80\x8d    # zero-width joiner
\xef\xbb\xbf   # BOM in middle of file
<!--.*-->       # HTML comments in markdown (check content)

# MCP tool poisoning
(?i)(execute|run|eval|spawn|exec)\s+.*\b(command|shell|bash|sh|cmd)\b
(?i)tool_choice.*forced
(?i)mcp.*server.*\{
```

### MCP config red flags

In any JSON with MCP server definitions:
- Servers pointing to remote URLs (not local tools)
- `command` fields running arbitrary scripts
- Environment variables being exfiltrated (`env` keys referencing secrets)
- Tool definitions that shadow built-in tools
- Overly broad file system access permissions

---

## Phase 3: Install Scripts & Hooks

### Package managers

```
# Node.js — package.json scripts
"(preinstall|postinstall|preuninstall|postuninstall|prepare|prepublish)"

# Python — setup.py / setup.cfg
cmdclass
install_requires.*\bgit\+
subprocess\.(call|run|Popen|check_output)

# Ruby — Gemfile / .gemspec
extensions.*\.so
post_install_message

# Rust — build.rs
Command::new
std::process::Command

# Go — go generate
//go:generate
```

### Git hooks

```
.git/hooks/*           # Any executable hooks
.husky/*               # Husky managed hooks
.lefthook.yml
.pre-commit-config.yaml
```

Flag any hook that: runs curl/wget, downloads files, or executes anything beyond linting/formatting.

### Docker

```
Dockerfile*
docker-compose*.yml
.devcontainer/devcontainer.json
```

Flag: `RUN curl | sh`, `RUN wget -O- | bash`, downloading and executing remote scripts.

### Makefiles

```
Makefile*
```

Flag: targets that download/execute remote content, especially in `install` or `setup` targets.

---

## Phase 4: Dependency Analysis

### Typosquatting indicators

Compare package names against well-known packages. Common patterns:
- One character off: `requets` vs `requests`, `lodsah` vs `lodash`
- Hyphen/underscore swap: `python-dateutil` vs `python_dateutil`
- Scope impersonation: `@anthropic/sdk` vs `@anthr0pic/sdk`
- Name prepend/append: `colors-js`, `node-fetch2`

### Suspicious dependency patterns

```
# Pinned to exact unusual version
"==0.0.1"
"1.0.0-alpha.999"

# Git dependencies (bypass registry)
"git+"
"github:"
"https://.*\.tar\.gz"

# Private registry
"registry":\s*"https?://(?!registry\.npmjs\.org|pypi\.org)
```

### Lockfile integrity

- If lockfile exists but has mismatched hashes
- Dependencies in lockfile not present in manifest
- Lockfile references non-standard registries

---

## Phase 5: Dangerous Code Patterns

### Code execution / eval

```
(?i)\beval\s*\(
(?i)\bexec\s*\(
(?i)\bFunction\s*\(
(?i)new\s+Function\s*\(
(?i)setTimeout\s*\(\s*['"`]
(?i)setInterval\s*\(\s*['"`]
(?i)child_process
(?i)subprocess\.(call|run|Popen|check_output|getoutput)
(?i)os\.system\s*\(
(?i)os\.popen\s*\(
(?i)Runtime\.getRuntime\(\)\.exec
(?i)ProcessBuilder
```

### Encoding / obfuscation

```
(?i)\batob\s*\(
(?i)\bbtoa\s*\(
(?i)base64\.(b64decode|decodebytes|decode)
(?i)Buffer\.from\s*\(.*,\s*['"]base64['"]
(?i)fromCharCode
(?i)String\.fromCodePoint
(?i)\\x[0-9a-fA-F]{2}\\x[0-9a-fA-F]{2}\\x[0-9a-fA-F]{2}
(?i)\\u[0-9a-fA-F]{4}\\u[0-9a-fA-F]{4}
(?i)0x[0-9a-fA-F]{6,}
```

### Network / exfiltration

```
(?i)\bfetch\s*\(\s*['"`]https?://
(?i)XMLHttpRequest
(?i)axios\.(get|post|put|delete)\s*\(
(?i)requests\.(get|post|put|delete)\s*\(
(?i)urllib\.request
(?i)http\.get\s*\(
(?i)net\.createConnection
(?i)new\s+WebSocket\s*\(
(?i)\bcurl\b.*https?://
(?i)\bwget\b.*https?://
(?i)dns\.(lookup|resolve)
```

### Sensitive file access

```
(?i)(~|HOME|USERPROFILE).*(\.ssh|\.aws|\.gnupg|\.config|\.env|\.npmrc|\.pypirc)
(?i)/etc/(passwd|shadow|hosts)
(?i)(GITHUB_TOKEN|AWS_SECRET|API_KEY|PRIVATE_KEY|SECRET_KEY|DATABASE_URL)
(?i)keychain|credential|wallet
(?i)\.env(\.(local|production|development))?
```

### Reverse shells / backdoors

```
(?i)/bin/(ba)?sh\s+-i
(?i)nc\s+(-e|-c)\s+/bin/(ba)?sh
(?i)mkfifo.*nc
(?i)python.*socket.*connect.*exec
(?i)perl.*socket.*exec
(?i)ruby.*TCPSocket.*exec
(?i)socat.*exec
(?i)bash.*>/dev/tcp/
(?i)telnet.*\|.*bash
```

### Crypto mining

```
(?i)(stratum|xmr|monero|coinhive|cryptonight|minergate)
(?i)crypto\.?miner
(?i)hashrate
(?i)mining\.?pool
(?i)coin\.?hive
```

---

## Phase 6: CI/CD & GitHub Actions

### Files to scan

```
.github/workflows/*.yml
.github/workflows/*.yaml
.gitlab-ci.yml
Jenkinsfile
.circleci/config.yml
.travis.yml
bitbucket-pipelines.yml
azure-pipelines.yml
```

### Red flags

```
# Dangerous triggers
pull_request_target    # Can access secrets from PRs
workflow_dispatch      # Remote trigger (check who can trigger)
repository_dispatch    # External webhook trigger

# Unsafe patterns
${{ github.event.*.body }}     # Unsanitized PR/issue body injection
${{ github.event.*.title }}    # Unsanitized title injection
run: |.*\$\{\{                 # Template injection in run steps

# Unverified external actions
uses:\s+[^/]+/[^@]+@[a-f0-9]{40}    # Pinned to commit (good but verify)
uses:\s+[^/]+/[^@]+@(main|master)    # Pinned to branch (dangerous)

# Secret exfiltration
echo.*\$\{\{\s*secrets\.
curl.*\$\{\{\s*secrets\.
```

---

## Phase 7: Binary & Encoded Content

### File types to flag

```
*.exe *.dll *.so *.dylib *.bin
*.wasm
*.pyc *.pyo
*.class
*.o *.a *.lib
```

### Large encoded blobs

- Base64 strings longer than 500 characters in source files
- Hex strings longer than 200 characters
- Data URIs with executable MIME types

### Steganography indicators

- Image files in unexpected locations (source directories, not assets)
- Unusually large image/media files for their dimensions
- Binary data appended after valid file endings
