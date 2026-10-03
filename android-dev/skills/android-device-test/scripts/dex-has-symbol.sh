#!/usr/bin/env bash
# Does the APK installed on the device (or a local .apk) contain <symbol>? Scans every classes*.dex.
# Usage: dex-has-symbol.sh <serial> <package|path/to.apk> <symbol> [workdir]
# BSD strings/grep miss symbols in binaries; `LC_ALL=C grep -a` doesn't.
serial="$1"; target="$2"; sym="$3"; work="${4:-${TMPDIR:-/tmp}/dex-has-symbol}"
rm -rf "$work"; mkdir -p "$work"
if [[ -f "$target" ]]; then apk="$target"; else
  path=$(adb -s "$serial" shell pm path "$target" | tr -d '\r' | sed -n 's/^package://p' | head -1)
  [[ -n "$path" ]] || { echo "package $target not installed on $serial"; exit 2; }
  apk="$work/base.apk"; adb -s "$serial" pull "$path" "$apk" >/dev/null
fi
unzip -o -q "$apk" 'classes*.dex' -d "$work/dex"
hits=$(cd "$work/dex" && LC_ALL=C grep -al -- "$sym" classes*.dex)
if [[ -n "$hits" ]]; then echo "FOUND $sym in: $hits"; else echo "NOT FOUND $sym ($(ls "$work/dex" | wc -l | tr -d ' ') dex files scanned)"; exit 1; fi
