# Changelog

All notable changes to hooks-notifier will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-06

### Changed
- **BREAKING**: Removed `PostToolUse` hook (logging moved to separate plugin)
- **BREAKING**: Removed OpenAI TTS provider - now only ElevenLabs and pyttsx3
- **BREAKING**: Removed LLM-generated completion messages - now uses predefined messages
- **BREAKING**: Removed logging functionality from all hooks
- **BREAKING**: Removed `--chat` flag and transcript export from Stop hook
- **BREAKING**: Removed `--notify` flag from Notification hook (always notifies)
- Simplified `SubagentStop` hook to sound-only (no TTS, no terminal-notifier)
- Streamlined codebase focused on core notification functionality

### Removed
- `hooks/post_tool_use.py` - Logging is not a notification concern
- `hooks/utils/llm/` directory - No more LLM-generated messages
- `hooks/utils/tts/openai_tts.py` - Simplified to ElevenLabs + pyttsx3

## [1.0.0] - 2024-12-05

### Added
- Initial release
- PostToolUse hook for logging all tool usage
- Notification hook with audio alerts when agent needs input
- Stop hook with completion notifications and optional TTS
- SubagentStop hook for subagent completion events
- Custom status line with context usage, git info, and file changes
- TTS support via ElevenLabs, OpenAI, and pyttsx3
- LLM-generated completion messages via OpenAI and Anthropic
- Configurable audio modes (simple, tts, none)
- Transcript logging to chat.json
- macOS system sound support
- Desktop notifications via terminal-notifier
