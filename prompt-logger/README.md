# prompt-logger

Logs user prompts submitted to Claude Code for analysis and review.

## Features

- **Automatic Prompt Capture**: Logs all user prompts to a JSON file
- **Centralized Logging**: All prompts are saved in `.claude/logs/` at the project root
- **Organized Storage**: Keeps Claude-related files together in the `.claude` directory
- **Smart Filtering**: Excludes commands (starting with `/`) and short prompts (20 characters or less)
- **Rich Metadata**: Captures timestamp, session ID, working directory, and project context
- **JSON Format**: Easy to parse and analyze

## How It Works

The plugin uses the `UserPromptSubmit` hook to capture prompts before they are processed. Each qualifying prompt is logged with metadata to `.claude/logs/prompts.json` in your project's root directory (where `.git` is located), ensuring all prompts are centralized in one location regardless of which subdirectory you're working in.

### Filtering Rules

Prompts are **NOT** logged if they:
- Start with `/` (slash commands)
- Are 20 characters or less (short prompts)

## Log Format

Each entry in `.claude/logs/prompts.json` contains:

```json
{
  "timestamp": "2024-12-05T10:30:45.123456",
  "prompt": "Help me refactor the authentication module to use JWT tokens",
  "length": 58,
  "session_id": "abc123...",
  "cwd": "/Users/you/projects/myapp/src/auth",
  "project_root": "/Users/you/projects/myapp",
  "relative_path": "src/auth"
}
```

### Fields

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp when the prompt was submitted |
| `prompt` | The full text of the user's prompt |
| `length` | Character count of the prompt |
| `session_id` | Claude Code session identifier |
| `cwd` | Current working directory when prompt was submitted |
| `project_root` | Project root directory (where `.git` is located) |
| `relative_path` | Path relative to project root (if applicable) |

## Installation

```bash
# Add the marketplace
/plugin marketplace add https://github.com/applab-nl/claude-code-plugins

# Install the plugin
/plugin install prompt-logger@applab-plugins
```

### Migrating from v1.1.0 or earlier

If you're upgrading from version 1.1.0 or earlier, your existing logs are in `logs/prompts.json`. Version 1.2.0 stores logs in `.claude/logs/prompts.json`. To migrate your existing logs:

```bash
# Run the migration script
python prompt-logger/migrate_logs.py
```

This will merge your existing logs into the new location and create a backup.

## Directory Structure

```
prompt-logger/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest with hook configuration
├── hooks/
│   └── log_prompt.py    # Prompt logging script
├── migrate_logs.py      # Migration script for v1.1.0 → v1.2.0
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## Use Cases

- **Prompt Analysis**: Review your prompting patterns to improve effectiveness
- **Documentation**: Keep a record of what you asked Claude to do
- **Training Data**: Collect prompts for fine-tuning or analysis
- **Audit Trail**: Track what instructions were given during development

## Requirements

- Python 3.8+
- `uv` package manager

## License

MIT
