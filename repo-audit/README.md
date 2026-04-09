# Repo Audit - Repository Security Scanner

Security audit for cloned repositories. Scans for backdoors, trojans, supply chain attacks, malicious install scripts, prompt injection, MCP tool poisoning, and dangerous code patterns before you run or trust any code.

## Features

- **7-phase security audit** covering metadata, prompt injection, install scripts, dependencies, dangerous code, CI/CD, and binary content
- **AI prompt injection detection** — the most critical and novel phase, scanning for attacks targeting AI coding assistants (CLAUDE.md, .cursorrules, MCP configs, etc.)
- **Supply chain analysis** — typosquatting detection, suspicious dependencies, lockfile integrity
- **Structured risk reports** with CLEAN/LOW/MEDIUM/HIGH/CRITICAL ratings
- **Context-aware scanning** — distinguishes benign patterns from genuinely malicious code

## Usage

```bash
# Navigate to a cloned repo, then run:
/repo-audit

# Or ask naturally:
# "audit this repo"
# "is this repo safe?"
# "scan for backdoors"
# "security scan"
```

## Audit Phases

| Phase | What It Checks |
|-------|---------------|
| 1. Metadata | Repo age, stars, contributors, README social engineering |
| 2. Prompt Injection | AI config files, hidden instructions, MCP poisoning |
| 3. Install Scripts | postinstall hooks, setup.py, Dockerfiles, Makefiles |
| 4. Dependencies | Typosquatting, git deps, private registries, lockfile integrity |
| 5. Dangerous Code | eval/exec, obfuscation, network calls, credential access, reverse shells |
| 6. CI/CD | GitHub Actions injection, secret exfiltration, unsafe triggers |
| 7. Binary Content | Executables, encoded blobs, steganography indicators |

## Risk Ratings

| Rating | Meaning |
|--------|---------|
| **CLEAN** | No findings at all |
| **LOW** | Minor findings, almost certainly benign |
| **MEDIUM** | Warrants manual review but not clearly malicious |
| **HIGH** | Likely malicious or extremely risky |
| **CRITICAL** | Confirmed malicious code |

## Installation

```bash
# Add the marketplace
/plugin marketplace add https://github.com/applab-nl/claude-code-plugins

# Install the plugin
/plugin install repo-audit@applab-plugins
```

## License

MIT
