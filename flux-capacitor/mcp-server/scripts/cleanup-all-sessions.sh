#!/bin/bash
# cleanup-all-sessions.sh - Clean up all flux-capacitor sessions (dev tool)

echo "Warning: This will kill all flux-capacitor sessions!"
read -p "Are you sure? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  tmux ls 2>/dev/null | grep '^flux-' | cut -d: -f1 | while read session; do
    echo "Killing session: $session"
    tmux kill-session -t "$session"
  done
  echo "All flux-capacitor sessions cleaned up."
else
  echo "Cancelled."
fi
