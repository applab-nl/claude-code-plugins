# Changelog

All notable changes to the Linear plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-25

### Added

- **Session rename on ticket start** — a new Step 7 names the session `<TICKET-ID> <short title>` (e.g. `APP-123 onboarding redirect loop`) as soon as the worktree exists, so parallel sessions stay tellable apart in `/resume`, the background-job list, and the terminal tab. The skill writes the session-title sidecar directly (the same file the built-in `/rename` persists) and prints a ready-to-run `/rename` line for the live header and tab title, which only the built-in command can update.

### Changed

- Start-mode steps 7–11 renumbered to 8–12 to make room for the rename step.
- Fixed a stale cross-reference in Step 4: it pointed at the workflow-state lookup rather than the status update when skipping the transition for an already-started ticket.
- The Step 12 summary now reports the session name alongside the worktree and ticket status.

## [1.0.0] - 2026-05-28

### Added

- Initial release of the `linear` skill, packaged as a plugin.
- **Start mode** — fetch a Linear ticket via the MCP, classify it as quick-fix vs spec-driven, create an isolated worktree using Linear's canonical `branchName`, move the ticket to "In Progress", and persist a `.linear-ticket.json` lifecycle sentinel.
- **Advance mode** — transition tickets to "In Review" on PR open and "Done" on merge based on the persisted sentinel.
- Routing matrix that chains into OpenSpec or superpowers follow-up skills depending on project layout and ticket classification.
- Workflow state resolution by `type` (not name), so customised Linear setups still work.
- Support for both the AppLab `linear` MCP plugin and the official claude.ai Linear connector.
