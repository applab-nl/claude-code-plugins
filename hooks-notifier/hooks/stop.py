#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Stop hook for Claude Code.
Notifies the user when the agent completes a task via sound, terminal-notifier, and optional TTS.
"""

import json
import os
import sys
import random
import subprocess
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


COMPLETION_MESSAGES = [
    "Work complete!",
    "All done!",
    "Task finished!",
    "Job complete!",
    "Ready for next task!"
]


def get_tts_script_path():
    """
    Determine which TTS script to use based on available API keys.
    Priority order: ElevenLabs > pyttsx3
    """
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"

    # Check for ElevenLabs API key (highest priority)
    if os.getenv('ELEVENLABS_API_KEY'):
        elevenlabs_script = tts_dir / "elevenlabs_tts.py"
        if elevenlabs_script.exists():
            return str(elevenlabs_script)

    # Fall back to pyttsx3 (no API key required)
    pyttsx3_script = tts_dir / "pyttsx3_tts.py"
    if pyttsx3_script.exists():
        return str(pyttsx3_script)

    return None


def play_sound(sound_name=None):
    """
    Play a system sound in the background.

    Args:
        sound_name: Name of the sound file (without .aiff extension).
                   If None, uses CLAUDE_AUDIO_SOUND env var or defaults to 'Glass'.
    """
    if sound_name is None:
        sound_name = os.getenv('CLAUDE_AUDIO_SOUND', 'Glass')

    sound_path = f"/System/Library/Sounds/{sound_name}.aiff"

    if not os.path.exists(sound_path):
        sound_path = "/System/Library/Sounds/Glass.aiff"

    try:
        subprocess.Popen(
            ["afplay", sound_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except (FileNotFoundError, subprocess.SubprocessError):
        pass


def send_terminal_notification(message):
    """Send a desktop notification via terminal-notifier."""
    try:
        cwd = Path.cwd()
        subtitle = f"{cwd.parent.name}/{cwd.name}"

        subprocess.run([
            "terminal-notifier",
            "-title", "Claude Code",
            "-subtitle", subtitle,
            "-message", message,
            "-sound", "none"
        ],
        capture_output=True,
        timeout=5
        )
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass


def announce_completion():
    """Announce task completion."""
    completion_message = random.choice(COMPLETION_MESSAGES)

    # Send terminal notification
    send_terminal_notification(completion_message)

    # Handle audio based on CLAUDE_AUDIO_MODE
    audio_mode = os.getenv('CLAUDE_AUDIO_MODE', 'simple').lower()

    if audio_mode == 'simple':
        play_sound()
    elif audio_mode == 'tts':
        tts_script = get_tts_script_path()
        if tts_script:
            subprocess.Popen([
                "uv", "run", tts_script, completion_message
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
            )
    # If audio_mode == 'none', skip audio


def main():
    try:
        # Read JSON input from stdin (required by hook interface)
        json.load(sys.stdin)

        # Announce completion
        announce_completion()

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
