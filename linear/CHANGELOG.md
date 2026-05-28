# Changelog

All notable changes to the Linear plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-28

### Added

- Initial release of the `linear` skill, packaged as a plugin.
- **Start mode** — fetch a Linear ticket via the MCP, classify it as quick-fix vs spec-driven, create an isolated worktree using Linear's canonical `branchName`, move the ticket to "In Progress", and persist a `.linear-ticket.json` lifecycle sentinel.
- **Advance mode** — transition tickets to "In Review" on PR open and "Done" on merge based on the persisted sentinel.
- Routing matrix that chains into OpenSpec or superpowers follow-up skills depending on project layout and ticket classification.
- Workflow state resolution by `type` (not name), so customised Linear setups still work.
- Support for both the AppLab `linear` MCP plugin and the official claude.ai Linear connector.
