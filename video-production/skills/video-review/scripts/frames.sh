#!/usr/bin/env bash
# Pull frames from the RENDERED file (not the preview) and tile them into one labeled contact sheet.
#
#   frames.sh out/film.mp4 out/review 0 1.2 3.5 7.99     # frames at these seconds + sheet.jpg
#   frames.sh out/loop.mp4 out/review seam               # last frame and frame 0 side by side
#   frames.sh out/film.mp4 out/review cut 4.2            # -0.2 .. +0.2 s around one cut
set -euo pipefail
in=${1:?video}; dir=${2:?output dir}; shift 2
mkdir -p "$dir"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print $1/($2?$2:1)}')
case "${1:-}" in
  seam) times=("$(awk -v d="$dur" -v f="$fps" 'BEGIN{printf "%.3f", d - 1/f}')" 0) ;;
  cut) c=${2:?cut time}; times=(); for o in -0.2 -0.1 0 0.1 0.2; do times+=("$(awk -v c="$c" -v o="$o" 'BEGIN{printf "%.3f", c + o}')"); done ;;
  *) times=("$@") ;;
esac
rm -f "$dir"/f-*.png
label=0; ffmpeg -hide_banner -filters 2>/dev/null | grep -q " drawtext " && label=1   # needs an ffmpeg built with freetype
i=0
for t in "${times[@]}"; do
  n=$(printf "%02d" $i)
  vf=null; [ $label = 1 ] && vf="drawtext=text='t=${t}':x=16:y=16:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8"
  ffmpeg -v error -y -ss "$t" -i "$in" -frames:v 1 -vf "$vf" "$dir/f-$n.png"
  # a seek into the last frame can return nothing: take the final decoded frame instead
  [ -s "$dir/f-$n.png" ] || ffmpeg -v error -y -sseof -0.5 -i "$in" -vf "$vf" -update 1 "$dir/f-$n.png"
  echo "f-$n.png  t=$t"
  i=$((i + 1))
done
cols=$(( i < 5 ? i : 5 ))
ffmpeg -v error -y -pattern_type glob -i "$dir/f-*.png" -vf "scale=640:-2,tile=${cols}x$(( (i + cols - 1) / cols )):padding=8:color=gray" \
  -frames:v 1 "$dir/sheet.jpg"
echo "$i frames, sheet: $dir/sheet.jpg (open it and look)"
