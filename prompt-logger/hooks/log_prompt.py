#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Prompt Logger Hook

Captures user prompts submitted to Claude Code and logs them to a JSON file.
Filters out:
- Commands (prompts starting with '/')
- Short prompts (20 characters or less)
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract the prompt text
        prompt = input_data.get("prompt", "")

        # Skip if prompt is empty
        if not prompt:
            sys.exit(0)

        # Skip commands (starting with '/')
        if prompt.strip().startswith("/"):
            sys.exit(0)

        # Skip short prompts (20 characters or less)
        if len(prompt.strip()) <= 20:
            sys.exit(0)

        # Ensure log directory exists
        log_dir = Path.cwd() / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "prompts.json"

        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, "r") as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Create log entry with timestamp and metadata
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "length": len(prompt),
            "session_id": input_data.get("session_id", ""),
            "cwd": str(Path.cwd())
        }

        # Append new entry
        log_data.append(log_entry)

        # Write back to file with formatting
        with open(log_path, "w") as f:
            json.dump(log_data, f, indent=2)

        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)


if __name__ == "__main__":
    main()
