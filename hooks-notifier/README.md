# hooks-notifier

Audio and visual notifications for Claude Code - alerts when input is required and when tasks complete.

## Features

- **Audio Notifications**: Get notified when Claude Code completes tasks or needs your input
- **Desktop Notifications**: Visual alerts via terminal-notifier
- **Text-to-Speech (TTS)**: Optional spoken announcements using ElevenLabs or pyttsx3
- **Custom Status Line**: Rich status bar showing model, directory, git branch, context usage, and file changes
- **macOS System Sounds**: Uses native system sounds for quick, non-intrusive notifications

## Hook Events

| Event | Description | Sound | Desktop Notification | TTS |
|-------|-------------|-------|---------------------|-----|
| `Notification` | Agent needs user input | Hero | Yes | Yes |
| `Stop` | Agent completed task | Glass | Yes | Yes |
| `SubagentStop` | Subagent completed | Ping | No | No |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_AUDIO_MODE` | Audio mode: `simple`, `tts`, or `none` | `simple` |
| `CLAUDE_AUDIO_SOUND` | System sound name (without .aiff) | Varies by event |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for high-quality TTS | - |

### Audio Modes

- **`simple`** (default): Plays macOS system sounds (fast, no API required)
- **`tts`**: Uses text-to-speech for spoken announcements
- **`none`**: Disables audio notifications (desktop notifications still work)

### TTS Priority

When `CLAUDE_AUDIO_MODE=tts`, the plugin selects TTS provider based on available API keys:

1. **ElevenLabs** (requires `ELEVENLABS_API_KEY`) - Highest quality
2. **pyttsx3** (no API key) - Offline fallback

## Status Line

The plugin includes a customizable status line showing:

- **Model**: Currently active Claude model
- **Directory**: Current working directory name
- **Git Branch**: Current branch (if in a git repo)
- **Context Usage**: Token usage with visual progress bar
- **Modified Files**: Count of git-tracked file changes

### Status Line Colors (Ayu Dark Theme)

- Green progress bar: < 50% context used
- Orange progress bar: 50-80% context used
- Red progress bar: > 80% context used

## Installation

```bash
# Add the marketplace
/plugin marketplace add https://github.com/applab-nl/claude-code-plugins

# Install the plugin
/plugin install hooks-notifier@applab-plugins
```

## Directory Structure

```
hooks-notifier/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest with hooks configuration
├── hooks/
│   ├── notification.py      # Input required notification
│   ├── stop.py              # Task completion notification
│   ├── subagent_stop.py     # Subagent completion sound
│   └── utils/
│       └── tts/
│           ├── elevenlabs_tts.py
│           └── pyttsx3_tts.py
├── statusline.sh            # Custom status line script
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## Requirements

- **Python 3.11+** with `uv` package manager
- **macOS** (for system sounds via `afplay`)
- Optional: `terminal-notifier` for desktop notifications

## License

MIT
