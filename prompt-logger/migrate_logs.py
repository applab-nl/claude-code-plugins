#!/usr/bin/env python3
"""
Migration script to move existing prompt logs from logs/ to .claude/logs/

This script helps migrate existing prompt logs from the old location (logs/prompts.json)
to the new location (.claude/logs/prompts.json) after updating to version 1.2.0.
"""

import json
import shutil
from pathlib import Path
from datetime import datetime


def find_project_root():
    """Find the project root directory by looking for .git"""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".git").exists():
            return current
        current = current.parent
    return Path.cwd()


def migrate_logs():
    """Migrate logs from old location to new location"""
    project_root = find_project_root()

    # Define paths
    old_log_path = project_root / "logs" / "prompts.json"
    new_log_dir = project_root / ".claude" / "logs"
    new_log_path = new_log_dir / "prompts.json"

    print(f"Project root: {project_root}")
    print(f"Old log location: {old_log_path}")
    print(f"New log location: {new_log_path}")
    print("-" * 50)

    # Check if old log exists
    if not old_log_path.exists():
        print("ℹ️  No existing logs found at old location. Nothing to migrate.")
        return

    # Load old logs
    try:
        with open(old_log_path, "r") as f:
            old_logs = json.load(f)
        print(f"✅ Found {len(old_logs)} log entries in old location")
    except (json.JSONDecodeError, Exception) as e:
        print(f"❌ Error reading old logs: {e}")
        return

    # Check if new log already exists
    if new_log_path.exists():
        try:
            with open(new_log_path, "r") as f:
                new_logs = json.load(f)
            print(f"ℹ️  Found {len(new_logs)} existing entries in new location")

            # Merge logs (old ones first, then new ones)
            merged_logs = old_logs + new_logs
            print(f"📋 Merging logs: {len(old_logs)} old + {len(new_logs)} new = {len(merged_logs)} total")
        except (json.JSONDecodeError, Exception) as e:
            print(f"⚠️  Warning: Could not read existing new logs: {e}")
            print("   Will use only old logs")
            merged_logs = old_logs
    else:
        merged_logs = old_logs
        print("ℹ️  No existing logs at new location")

    # Create new directory if needed
    new_log_dir.mkdir(parents=True, exist_ok=True)

    # Write merged logs to new location
    try:
        with open(new_log_path, "w") as f:
            json.dump(merged_logs, f, indent=2)
        print(f"✅ Successfully migrated {len(merged_logs)} log entries to {new_log_path}")
    except Exception as e:
        print(f"❌ Error writing to new location: {e}")
        return

    # Create backup of old logs
    backup_name = f"prompts.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    backup_path = old_log_path.parent / backup_name
    try:
        shutil.copy2(old_log_path, backup_path)
        print(f"✅ Created backup at: {backup_path}")
    except Exception as e:
        print(f"⚠️  Warning: Could not create backup: {e}")

    # Ask user if they want to delete old log
    print("\n" + "=" * 50)
    print("Migration complete!")
    print(f"Your old log has been backed up to: {backup_path}")
    print(f"The original log is still at: {old_log_path}")
    print("\nYou can safely delete the old log file if you want.")
    print("To delete it, run: rm " + str(old_log_path))


if __name__ == "__main__":
    print("Prompt Logger Migration Script (v1.1.0 → v1.2.0)")
    print("=" * 50)
    migrate_logs()