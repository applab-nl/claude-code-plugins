#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

"""
SubagentStop hook for Claude Code.
Plays an optional sound when a subagent completes.
"""

import json
import os
import sys
import subprocess


def play_sound(sound_name="Ping"):
    """
    Play a system sound in the background.

    Args:
        sound_name: Name of the sound file (without .aiff extension).
                   Defaults to 'Ping' for subagent completions.
    """
    sound_path = f"/System/Library/Sounds/{sound_name}.aiff"

    if not os.path.exists(sound_path):
        sound_path = "/System/Library/Sounds/Ping.aiff"

    try:
        subprocess.Popen(
            ["afplay", sound_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except (FileNotFoundError, subprocess.SubprocessError):
        pass


def main():
    try:
        # Read JSON input from stdin (required by hook interface)
        json.load(sys.stdin)

        # Only play sound if audio mode is 'simple' or not set
        audio_mode = os.getenv('CLAUDE_AUDIO_MODE', 'simple').lower()

        if audio_mode in ('simple', 'tts'):
            play_sound()
        # If audio_mode == 'none', skip audio

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
