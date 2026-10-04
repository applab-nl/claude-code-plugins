#!/usr/bin/env bash
# Wait until a physical device (or $1 / $ANDROID_SERIAL) is attached and authorized.
# Usage: wait-device.sh [serial] [timeout-seconds=300]
serial="${1:-$ANDROID_SERIAL}"; timeout="${2:-300}"; waited=0
while (( waited < timeout )); do
  line=$(adb devices | awk -v s="$serial" 'NR>1 && NF>=2 && (s=="" ? $1 !~ /^emulator/ : $1==s) {print $1, $2; exit}')
  state=${line#* }
  case "$state" in
    device) echo "ready: ${line% *}"; exit 0 ;;
    unauthorized) echo "unauthorized: accept the USB debugging prompt on the phone" ;;
  esac
  sleep 5; waited=$((waited + 5))
done
echo "TIMEOUT: no device${serial:+ $serial} after ${timeout}s (check cable, unlock the phone, USB debugging on)"; exit 1
