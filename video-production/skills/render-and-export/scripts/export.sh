#!/usr/bin/env bash
# Delivery exports from a rendered master, with ffmpeg only.
#
#   export.sh mp4    in.mp4 out.mp4              # H.264 crf 16, yuv420p, faststart, AAC 256k
#   export.sh rotate in.mp4 3.5 out.mp4          # loop starts at 3.5 s, so frame 0 is a busy moment
#   export.sh gif    in.mp4 out.gif [width] [fps] # palettegen diff + sierra2_4a, default 720 wide, 25 fps
#   export.sh poster in.mp4 3.5 out.jpg          # one frame as a still, for the thumbnail or a cover
#   export.sh info   file                        # size, resolution, fps, duration, audio yes or no
set -euo pipefail
cmd=${1:?mp4|rotate|gif|poster|info}; in=${2:?input}

has_audio() { [ -n "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$1")" ]; }
H264=(-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart)

case "$cmd" in
  mp4)
    out=${3:?output}
    if has_audio "$in"; then a=(-c:a aac -b:a 256k -ar 48000); else a=(-an); fi
    ffmpeg -v error -y -i "$in" "${H264[@]}" "${a[@]}" "$out" ;;
  rotate)
    at=${3:?seconds}; out=${4:?output}
    v="[0:v]trim=start=${at},setpts=PTS-STARTPTS[va];[0:v]trim=end=${at},setpts=PTS-STARTPTS[vb];[va][vb]concat=n=2:v=1:a=0[v]"
    if has_audio "$in"; then
      f="${v};[0:a]atrim=start=${at},asetpts=PTS-STARTPTS[aa];[0:a]atrim=end=${at},asetpts=PTS-STARTPTS[ab];[aa][ab]concat=n=2:v=0:a=1[a]"
      ffmpeg -v error -y -i "$in" -filter_complex "$f" -map "[v]" -map "[a]" "${H264[@]}" -c:a aac -b:a 256k "$out"
    else
      ffmpeg -v error -y -i "$in" -filter_complex "$v" -map "[v]" "${H264[@]}" "$out"
    fi ;;
  gif)
    out=${3:?output}; w=${4:-720}; fps=${5:-25}
    # GIF frame delays are whole centiseconds: 25 fps = 4 cs exactly; 30 fps rounds to 3 cs and plays 11% fast.
    case "$fps" in 10|20|25|50) ;; *) echo "warning: ${fps} fps is not a whole number of centiseconds per frame" >&2 ;; esac
    ffmpeg -v error -y -i "$in" -filter_complex \
      "[0:v]fps=${fps},scale=${w}:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
      -loop 0 "$out" ;;
  poster)
    at=${3:?seconds}; out=${4:?output}
    ffmpeg -v error -y -ss "$at" -i "$in" -frames:v 1 -q:v 2 "$out" ;;
  info) ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac

f=${out:-$in}
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate:format=duration,size \
  -of default=nw=1 "$f" | tr '\n' ' '
if has_audio "$f"; then echo "audio=yes  $f"; else echo "audio=no  $f"; fi
