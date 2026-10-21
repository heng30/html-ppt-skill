#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
S=$(cd ../.. && pwd)
node "$S/scripts/build-video.js" storyboard.js \
  --srt=subtitles.srt --out=video.html --images=images --audio=audio.wav
NODE_PATH=$(npm root -g) node "$S/scripts/render-video.js" video.html --stills=5,90,290
