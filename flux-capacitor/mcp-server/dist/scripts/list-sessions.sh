#!/bin/bash
# list-sessions.sh - List all flux-capacitor sessions

tmux ls 2>/dev/null | grep '^flux-' || echo "No flux-capacitor sessions found"
