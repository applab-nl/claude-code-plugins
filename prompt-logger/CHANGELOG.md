# Changelog

All notable changes to prompt-logger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-01-04

### Added
- Capture AskUserQuestion tool interactions (questions Claude asks and user answers)
- New `PostToolUse` hook for `AskUserQuestion` tool events
- New `log_question.py` hook script to process question/answer logging
- Added `type` field to all log entries ("prompt" or "question_answer")

### Changed
- Log entries now include a `type` field for distinguishing between user prompts and Q&A interactions

## [1.2.0] - 2024-12-23

### Changed
- **BREAKING:** Prompts are now saved in `.claude/logs/prompts.json` instead of `logs/prompts.json` for better organization with other Claude-related files

## [1.1.0] - 2024-12-23

### Changed
- **BREAKING:** Prompts are now always logged at the project root directory (where `.git` is located) instead of the current working directory
- Added `project_root` field to log entries showing the detected project root
- Added `relative_path` field to log entries showing the path relative to project root

### Added
- Auto-detection of project root directory by traversing up to find `.git` directory
- Fallback to current working directory if no git repository is found

## [1.0.0] - 2024-12-05

### Added
- Initial release
- UserPromptSubmit hook for capturing user prompts
- Filtering for commands (starting with `/`)
- Filtering for short prompts (20 characters or less)
- JSON logging with timestamp, session ID, and working directory
- Automatic log directory creation
