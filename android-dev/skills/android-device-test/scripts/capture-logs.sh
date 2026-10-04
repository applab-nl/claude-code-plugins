#!/usr/bin/env bash
# Logcat capture that survives the device dropping off and being re-plugged.
# Usage: capture-logs.sh <serial> <outfile> [logcat filter args, e.g. -s MyTag:V or *:W]
# Run with Bash run_in_background; stop with: pkill -f "capture-logs.sh $1"
serial="$1"; out="$2"; shift 2
while true; do
  adb -s "$serial" wait-for-device
  echo "--- attached $(date '+%H:%M:%S') ---" >> "$out"
  adb -s "$serial" logcat -v time "$@" >> "$out" 2>&1
  echo "--- detached $(date '+%H:%M:%S') ---" >> "$out"
  sleep 2
done
