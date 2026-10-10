# Changelog

All notable changes to the terminal-browser plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-10-10

### Vendored by AppLab
- Imported the `claude-code-plugin/` directory of [zenbu-labs/terminal-browser](https://github.com/zenbu-labs/terminal-browser) at commit `2165ae76c9639e3996829ab0e6d54ddbd4f06ad8` (MIT, Zenbu Labs, Inc.), so plugin updates are reviewed and pulled in deliberately. All files are byte-identical to upstream except `README.md` (vendoring note and AppLab install commands) and `.claude-plugin/plugin.json` (adds `homepage`). The repo-root `LICENSE` was added because the plugin directory ships none.
- **Only the plugin is vendored.** The app it drives (`terminal-browser` CLI, Electron browser, Rust engine) is a separate product installed from `https://terminal-browser.sh` and stays outside this marketplace.
- Needs Claude Code with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`. The upstream README marks the plugin as experimental.

### Security review: the plugin (rating LOW)
Read in full by an independent read-only reviewer, including the server side of its bridge.
- No obfuscation, eval or dynamic import, no off-machine traffic and no persistence from the plugin. All HTTP goes to `127.0.0.1`.
- The only processes it runs are `terminal-browser capabilities` and `terminal-browser claude-bridge launch`, with fixed argv, via `$.process.run`.
- The bridge binds to `127.0.0.1` on a random port, requires a 24-byte bearer token, exits after 60 s idle, and has no eval, cookie, file-read or command endpoints. The browser cannot reach it without the token (the Authorization header forces a failing CORS preflight).
- The optional `agentTool` setting is off by default and then gives the model only `open(url)` and `close`.

### Known issues (upstream, unpatched)
- **Trust is delegated to whatever `terminal-browser` is on `PATH`.** The plugin is only as safe as the app it launches.
- **Dev-only branch.** `register.tsx` also runs `node <plugin root>/../cli/dist/main.js` if that file exists. In this marketplace nothing creates it; delete the branch if you want it impossible.
- **Any URL scheme is accepted** by the `open` tool and `$.browser.open` (`file:`, `javascript:`, `data:` are not filtered by the plugin). Whether the app honours them was not verified.
- **Page text can reach the prompt** through the user-initiated "Send to agent" grab. It fills the prompt and does not submit it.
- The bearer token is passed to the bridge process in argv and the browser's environment, and an unauthenticated Unix socket in the temp dir accepts the first connection (low).
- Any other plugin in the same session can call `$.browser.open/close`.

### Before installing the app (reviewed at the same commit, rating LOW-MEDIUM)
The full Rust engine (`pixel/`, 231 files) was not read line by line; patterns were grepped instead and nothing malicious turned up.
- **Install:** `curl -fsSL https://terminal-browser.sh/install | bash` fetches a tarball from a Cloudflare Worker and verifies a SHA-256 that comes from the same origin, so it catches corruption, not tampering. There is no signature. Pinned installs exist at `/install/v/<version>`, and Homebrew is available.
- **Setup runs automatically** after install: it symlinks the app's skill into `~/.claude/skills` and other agents' skill dirs (default yes when there is no tty, and the content changes on every app update), and sets `terminal.integrated.enableImages` in VS Code-family settings. Skip it with `TERMINAL_BROWSER_SKIP_SETUP=1`.
- **Upgrade:** `terminal-browser upgrade` runs `curl <url from server JSON> | bash` with no signature or origin check, so the release origin can push arbitrary shell. Nothing updates silently, but an update check runs at session start (disable: `terminal-browser config set updates.check off`).
- **Telemetry** (PostHog EU) is on by default: version, os/arch, terminal name, a random id, and the error class name on crashes. No URLs, page content or prompts. Disable with `DO_NOT_TRACK=1`, `TERMINAL_BROWSER_NO_TELEMETRY=1`, or `config set telemetry.usage off`. Payloads are also logged locally to `telemetry.jsonl`.
- **Profile:** a persistent browser profile with encrypted cookies. Nothing imports cookies from your real browsers. A skill-driven agent can act inside logged-in sessions.
- **Release pipeline:** CI actions are tag-pinned, not SHA-pinned; every push to `main` publishes the dev channel; macOS builds run on a self-hosted runner holding signing secrets.

### Updating
Diff `claude-code-plugin/` upstream against the pinned commit, re-run the review on the diff, then bump this entry, `plugin.json` and `marketplace.json`.
