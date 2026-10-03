#!/usr/bin/env bash
# Android Auto Desktop Head Unit helper.
# Usage: dhu.sh start <serial> <logfile>   (run with Bash run_in_background)
#        dhu.sh stop
set -u
DHU_DIR="${ANDROID_HOME:-$HOME/Library/Android/sdk}/extras/google/auto"
case "${1:-}" in
  start)
    [[ -x "$DHU_DIR/desktop-head-unit" ]] || { echo "DHU missing: install SDK package 'extras;google;auto'"; exit 2; }
    adb -s "$2" forward tcp:5277 tcp:5277 || exit 1
    cd "$DHU_DIR"
    # The DHU exits at once without a live stdin, which a background shell doesn't give it.
    tail -f /dev/null | ./desktop-head-unit > "$3" 2>&1 ;;
  stop)
    pkill -f desktop-head-unit; pkill -f "tail -f /dev/null"; echo stopped ;;
  *) echo "usage: dhu.sh start <serial> <logfile> | stop"; exit 2 ;;
esac
