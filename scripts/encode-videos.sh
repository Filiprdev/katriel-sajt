#!/usr/bin/env bash
# Compress source videos for the web: H.264 720p (long edge 1280), max 30 fps, AAC 96k, faststart.
# Usage: bash scripts/encode-videos.sh "<path to katriel_photo folder>"
# Output: public/media/<group>/<name>.mp4 (skips files that already exist).
set -u
SRC="$1"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"

# source (relative to SRC) | output (relative to OUT)
LIST=(
  "revija/REVIJA.mp4|show/runway.mp4"
  "revija/PROGRAM.mp4|show/program.mp4"
  "revija/BTS.mp4|show/backstage.mp4"
  "revija/1..mp4|story/chapter-1.mp4"
  "revija/2..mp4|story/chapter-2.mp4"
  "revija/3..mp4|story/chapter-3.mp4"
  "revija/4..mp4|story/chapter-4.mp4"
  "poznati/milica_pavlovic.mov|worn-by/milica-pavlovic.mp4"
  "poznati/dara_bubaamara.mp4|worn-by/dara-bubamara.mp4"
  "poznati/angelina_1.mp4|worn-by/angelina.mp4"
  "wetransfer_katriel-mindjuse-mp4_2026-11-14_1555/KATRIEL KORSET 1.mp4|films/corset.mp4"
  "wetransfer_katriel-mindjuse-mp4_2026-11-14_1555/KATRIEL MINDJUSE.mp4|films/earrings.mp4"
  "wetransfer_katriel-mindjuse-mp4_2026-11-14_1555/KATRIEL TORBICA FINAL .mp4|films/bag.mp4"
  "wetransfer_black-smoke-mp4_2026-11-14_1549/black smoke.mp4|films/black-smoke.mp4"
  "celebrity_new/breskvica.mp4|celebrities/breskvica.mp4"
  "celebrity_new/breskvica_singer1.mov|celebrities/breskvica-usce.mp4"
  "celebrity_new/breskvica_singer.mov|celebrities/breskvica-2.mp4"
  "celebrity_new/draganamirkovic2_singer.mov|celebrities/dragana-mirkovic.mp4"
  "celebrity_new/emaradujko_singer.mov|celebrities/ema-radujko.mp4"
  "celebrity_new/sandraafrika1_singer.mov|celebrities/sandra-afrika.mp4"
  "celebrity_new/katarina_grujic_singer5.mp4|celebrities/katarina-grujic.mp4"
  "celebrity_new/katarina_grujic_singer2.mp4|celebrities/katarina-grujic-2.mp4"
  "celebrity_new/sajsi_mc_rapper.mp4|celebrities/sajsi-mc.mp4"
  "celebrity_new/tea_tairovic_singer.mov|celebrities/tea-tairovic.mp4"
)

for row in "${LIST[@]}"; do
  in="$SRC/${row%%|*}"
  out="$OUT/${row##*|}"
  [ -f "$out" ] && { echo "skip $out"; continue; }
  mkdir -p "$(dirname "$out")"
  scale="scale='if(gte(iw,ih),min(1280,iw),-2)':'if(gte(iw,ih),-2,min(1280,ih))'"
  echo "encode $(basename "$in") -> $out"
  ffmpeg -nostdin -v error -y -i "$in" \
    -vf "$scale,fps=fps='min(source_fps,30)'" \
    -c:v libx264 -preset medium -crf 26 -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 96k -ac 2 -movflags +faststart "$out" || echo "FAILED $in"
done
du -sh "$OUT"/* 2>/dev/null
