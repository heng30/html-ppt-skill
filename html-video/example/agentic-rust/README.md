# Agent 对 Rust 意味着什么 · 完整分镜

12 分钟、50 镜、25fps 的完整例子。静态语言来自 `source.html` 与 `slides/`，
时间来自 `subtitles.srt`。

```bash
./build.sh          # 构建 video.html 并抽三帧
```

完整出片需要把配音放到本目录 `audio.wav`，然后：

```bash
NODE_PATH=$(npm root -g) node ../../scripts/render-video.js video.html \
  --fps=25 --segment=60 --concurrency=6 --out=agentic-rust.mp4
```

产物：带内嵌字幕和音轨的 MP4，外加同名外挂 `.srt`。
