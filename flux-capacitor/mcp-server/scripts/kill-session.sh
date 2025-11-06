#!/bin/bash
# kill-session.sh - Kill a flux-capacitor session

SESSION_ID=$1

if [[ -z "$SESSION_ID" ]]; then
  echo "Usage: $0 <session-id>" >&2
  exit 1
fi

TMUX_SESSION="flux-$SESSION_ID"
tmux kill-session -t "$TMUX_SESSION"
