#!/usr/bin/env bash
# Usage: scripts/prepare-media.sh [source.mp4]  — regenerates everything in public/media
set -euo pipefail
SRC="${1:-public/media/dragon-original.mp4}"; O=public/media
# a) all-intra scrub video (every frame is a keyframe => smooth currentTime seeking)
ffmpeg -y -v error -i "$SRC" -an -vf scale=1280:-2 -c:v libx264 -g 1 -crf 28 -pix_fmt yuv420p -movflags +faststart $O/dragon-scrub.mp4
ffmpeg -y -v error -i "$SRC" -an -vf scale=1280:-2 -c:v libvpx-vp9 -g 1 -crf 36 -b:v 0 -row-mt 1 $O/dragon-scrub.webm
# b) frame sequence (~180 frames) for canvas fallback (Safari/mobile)
ffmpeg -y -v error -i "$SRC" -vf "fps=18,scale=1280:-2" -q:v 5 $O/frames/f_%03d.jpg
# c) poster + blurred placeholder
ffmpeg -y -v error -i "$SRC" -frames:v 1 -update 1 -vf scale=1280:-2 -q:v 3 $O/poster.jpg
ffmpeg -y -v error -i "$SRC" -frames:v 1 -update 1 -vf "scale=32:-2,gblur=sigma=1" -q:v 6 $O/poster-blur.jpg
# gallery stills (one per beat of the film)
i=1; for t in 0.5 2.5 4.6 6.8 8.0 9.4; do ffmpeg -y -v error -ss $t -i "$SRC" -frames:v 1 -update 1 -vf scale=900:-2 -q:v 4 public/gallery/g$i.jpg; i=$((i+1)); done
