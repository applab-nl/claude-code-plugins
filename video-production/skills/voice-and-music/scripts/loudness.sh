#!/usr/bin/env bash
# Measure or set loudness with ffmpeg's EBU R128 tools. One static gain, never a per-line squash.
#
#   loudness.sh measure film.mp4                 # integrated LUFS, range (LRA), true peak
#   loudness.sh gain dialogue.wav -23 out.wav    # one gain so the stem sits at -23 LUFS, range kept
#   loudness.sh master film.mp4 -14 final.mp4    # two-pass, linear: whole film to -14 LUFS, -1 dBTP
set -euo pipefail
cmd=${1:?measure|gain|master}; in=${2:?input}

stats() {  # prints: I LRA TP
  ffmpeg -hide_banner -nostats -i "$1" -vn -af ebur128=peak=true -f null - 2>&1 |
    awk '/Integrated loudness:/{f=1} f&&/ I:/{i=$2} f&&/ LRA:/{l=$2} f&&/ Peak:/{p=$2} END{print i, l, p}'
}

case "$cmd" in
  measure)
    read -r I LRA TP < <(stats "$in")
    echo "integrated ${I} LUFS, range ${LRA} LU, true peak ${TP} dBTP" ;;
  gain)
    target=${3:?target LUFS}; out=${4:?output}
    read -r I _ _ < <(stats "$in")
    g=$(awk -v t="$target" -v i="$I" 'BEGIN{printf "%.2f", t - i}')
    ffmpeg -v error -y -i "$in" -af "volume=${g}dB" "$out"
    echo "applied ${g} dB: ${I} -> ${target} LUFS" ;;
  master)
    target=${3:?target LUFS}; out=${4:?output}
    m=$(ffmpeg -hide_banner -nostats -i "$in" -vn -af "loudnorm=I=${target}:TP=-1:LRA=20:print_format=json" -f null - 2>&1 |
        sed -n '/^{/,/^}/p')
    get() { echo "$m" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
    af="loudnorm=I=${target}:TP=-1:LRA=20:linear=true:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset)"
    if [[ "$out" == *.wav ]]; then codec=(-vn); else codec=(-c:v copy -c:a aac -b:a 256k -movflags +faststart); fi
    ffmpeg -v error -y -i "$in" -af "$af" -ar 48000 "${codec[@]}" "$out"
    read -r I LRA TP < <(stats "$out")
    echo "mastered: ${I} LUFS, range ${LRA} LU, true peak ${TP} dBTP" ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
