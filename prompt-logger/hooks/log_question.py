#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
AskUserQuestion Logger Hook

Captures AskUserQuestion tool interactions (questions asked by Claude
and answers provided by the user) and logs them to a JSON file.
"""

import json
import sys
from datetime import datetime
from pathlib import Path


def find_project_root():
    """Find the project root directory by looking for .git"""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".git").exists():
            return current
        current = current.parent
    # If no .git found, fallback to current working directory
    return Path.cwd()


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Verify this is an AskUserQuestion tool event
        tool_name = input_data.get("tool_name", "")
        if tool_name != "AskUserQuestion":
            sys.exit(0)

        # Extract questions and answers
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})

        questions = tool_input.get("questions", [])
        answers = tool_response.get("answers", {})

        # Skip if no questions or answers
        if not questions or not answers:
            sys.exit(0)

        # Find project root and ensure log directory exists there
        project_root = find_project_root()
        log_dir = project_root / ".claude" / "logs"
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
            "type": "question_answer",
            "timestamp": datetime.now().isoformat(),
            "questions": questions,
            "answers": answers,
            "session_id": input_data.get("session_id", ""),
            "tool_use_id": input_data.get("tool_use_id", ""),
            "cwd": str(Path.cwd()),
            "project_root": str(project_root),
            "relative_path": str(Path.cwd().relative_to(project_root)) if Path.cwd().is_relative_to(project_root) else str(Path.cwd())
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
