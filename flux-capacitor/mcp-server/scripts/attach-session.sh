#!/bin/bash
# attach-session.sh - Attach to a flux-capacitor session

SESSION_ID=$1

if [[ -z "$SESSION_ID" ]]; then
  echo "Usage: $0 <session-id>" >&2
  exit 1
fi

TMUX_SESSION="flux-$SESSION_ID"
tmux attach -t "$TMUX_SESSION"
