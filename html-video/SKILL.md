---
name: html-video
description: html-video：音频 + SRT + 静态稿 → 带动效、内嵌字幕与音轨的 MP4。逐帧渲染、分段生成、最后合并。触发：做视频、生成视频、导出 MP4、字幕对齐、SRT 转视频、带字幕的视频、科普视频、动态画面、配音配画面、把 PPT 做成视频。
disable-model-invocation: true
---

# html-video：音频 + 字幕 + 静态稿 → 视频

把三样已有资源做成一条连续时间轴上的片子：

| 资源 | 必需 | 作用 |
|---|---|---|
| `output.wav` | 是 | 唯一的声音来源；成片挂同一条音轨 |
| `output.srt` | 是 | 唯一的时间源；画面、内嵌字幕、外挂字幕都从它推出来 |
| `index.html` | 是 | 静态稿；提供文案、章节、信息层级 |
| `slides/*.png` | 辅助 | 静态视觉基准；1920×1080 的版式、色彩、字号从这里对齐 |
| `images/*` | 可选 | 文中要出现的真图；构建时自动复制并冻结 GIF |

**做的是**：讲解片、科普片、读书笔记片、产品说明片，尤其是「已经有一版 PPT 和配音」的情况。
**不做的是**：静态翻页 deck（用 `html-ppt`）、需要实拍或复杂三维的片、人声合成（配音自己生成，本 skill 负责对齐与挂载）。

核心区别：幻灯片是「一页一屏、翻页」，视频是「一条时间轴上的运动」。不要录屏翻页，也不要把 PPT 每页原样搬上来加一个淡入。

---

## 依赖

```bash
node -v                                   # ≥ 18
NODE_PATH=$(npm root -g) node -e "require('playwright'); console.log('playwright ok')"
ffmpeg -version | head -1                 # 需要 libx264 + aac
fc-list :lang=zh family | sort -u | head  # 至少一个中文字体
```

缺 playwright：`npm install -g playwright && npx playwright install chromium`。
下面命令都在**项目目录**跑；`$SKILL` 是本 skill 根目录（这份 SKILL.md 所在目录），不是项目目录。

---

## 一、时间只有一个来源

```
SRT cue 时间 ──→ 内嵌字幕带（烧进画面，底部 902–1080）
     ├────────→ 外挂 .srt（渲染后自动导出，可开关）
     └────────→ 分镜起止（scene.cue / scene.until，按 SRT 序号 1-based）
                    └─→ 镜头内高亮/计数时刻（行、数字、流程节点都绑 cue）
```

两条硬规则：

1. **逐帧 seek 渲染，不录屏。** 页面时钟被冻结，渲染器逐帧调 `window.__seek(t)` 截图。同输入同输出，第 N 帧恒等于第 N/fps 秒。录屏会漂移，字幕越到后面越错。
2. **元素绑 cue 序号，不手写秒数。** 改字幕时画面跟着走；SRT 是唯一时间轴。

配音与画面同源：成片直接把 `output.wav` 挂到合并后的视频上，`apad` 补齐尾部，不重采样、不二次对轴。

---

## 二、目录

```
$SKILL/
  template/video.html        零依赖模板：SRT 解析 + 时间轴引擎 + 14 种镜头 + 内嵌字幕带
  scripts/probe-project.js   开工体检：音频时长、SRT 缺口、静态稿页数、图片清单
  scripts/srt2shots.js       SRT → cue 清单 + 切镜建议（cue 为 1-based）
  scripts/build-video.js     分镜 + SRT + 图片 → 可渲染的 video.html
  scripts/render-video.js    逐帧截图 → 分段编码 → 合并 → 挂音轨 → 导出 .srt
  scripts/check-captions.js  内嵌字幕自检（文本、压字、越界）
  fonts/                     字幕字体（NotoSansCJK-VF.otf.ttc），构建时复制进产物
  example/agentic-rust/      跑通的完整分镜（12 分钟，50 镜源 → 自动拆成 57 镜，25fps）
```

---

## 三、流程

### 0 · 体检

```bash
node $SKILL/scripts/probe-project.js \
  --audio=output.wav --srt=output.srt --html=index.html \
  --slides=slides --images=images
```

看三件事：音频与末句字幕是否差得离谱、SRT 有没有重叠、静态稿几页。时差 > 5s 先确认是不是同一版配音。

### 1 · 看静态稿，定方向

先看 `slides/*.png`，把静态语言写成 `brand-spec.md` 或 `design-reference.md`：

- 色板（纸白、墨黑、正文灰、强调色）
- 字体（标题黑体 / 引语大字（衬线为系统回退，不随片内嵌）/ 标签等宽）
- 版心（左右、顶部、内容底线、字幕带）
- 三类母题（发丝线、大数字、单色强调）

**方向门**（参考 huashu-design）：没有现成静态稿时，先出三个方向板（真实渲出的关键帧 + 色板 + 一句定位），用户选定后写 `direction-approved.md` 再开工。用户直接给了 `slides` 就视为方向已定，把「用户原话 / 参考文件」写进 `direction-approved.md`。

### 2 · 摸清字幕，写导演稿

```bash
node $SKILL/scripts/srt2shots.js output.srt
```

输出每条 cue 的起止和切镜建议。按内容写 `导演稿.md`：每镜的 cue 区间、类型、主角、文案、动效。

切镜原则：

- 一镜一个意思，**8–15 秒**；超过 15 秒就拆，不要靠缩字号塞
- `build-video.js` 会自动把超过 15 秒、且内容 ≥4 条的镜头按 cue 对半拆；拆完两半都保留完整标题位，用 `title1` / `title2` 分别覆盖
- 列表类镜头**内容全部提前就位**，正在讲的那一条只换文字颜色（橙），不做底色块、不做位移
- 镜头切换用**硬切**：上一镜到点立即隐藏，下一镜从第一帧完整出现；不预显示、不交叉淡化
- 句间静默 ≥1.2s 是天然换镜点
- 一镜最多 3 行要点、3 个关键词、6 个流程节点
- 全片 45 秒约 5 镜；12 分钟约 45–55 镜

### 3 · 写分镜

`storyboard.js` 导出 `{ META, SCENES }`。cue / until 是 **SRT 序号（1-based，含两端）**，必须连续覆盖、不重叠。

```js
module.exports = {
  META: { tail: 0.3, audio: '../output.wav' },
  SCENES: [
    {
      cue: 1, until: 4, type: 'cover',
      section: '00', kicker: '语言设计 / AGENTIC DEV', hud: 'REBASE / SPLASH · 2026',
      title: ['Agent 对 Rust', '意味着什么，', '以及反向的作用'],
      sub: '一句话副标题。',
      sideTitle: '论证路线',
      side: [{ i: '01', t: '现状', cue: 1 }],
      meta: [['讲者', 'Niko Matsakis'], ['场合', 'REBASE']],
    }
  ]
};
```

`META` 只放两个字段：`tail`（片尾留白秒数，默认 0.3）、`audio`（音频相对路径，可被 `--audio` 覆盖）。

字段约定：

| 字段 | 说明 |
|---|---|
| `cue` / `until` | SRT 序号，1-based，含两端；不是秒 |
| `type` | 见第四节 |
| `section` | 顶栏左侧编号 |
| `kicker` | 顶栏左侧标签；同镜内容不重复出现 |
| `hud` | 可选，覆盖顶栏标签 |
| `title` | 字符串或字符串数组；数组每项一行，切镜时整块出现 |
| `lede` | 标题下一到两句 |
| `title1` / `title2` | 长镜头被自动拆分时，分别覆盖前半 / 后半的标题 |
| `footRight` | 底部细分隔线右侧的 mono 小标签；不写则回退 `kicker` |
| 子项 `cue` | 该元素的聚焦 cue；内容提前就位，cue 只推动高亮、计数和进度条 |

### 4 · 构建、预览、对轴

```bash
node $SKILL/scripts/build-video.js storyboard.js \
  --srt=output.srt --out=video.html --images=images --audio=output.wav
```

产物是单文件 HTML（图片在 `assets/`，字体在 `fonts/`），双击可预览：空格播放、←→ 逐帧、`?t=42.5` 跳时间。

`build-video.js` 还支持 `--fonts=<dir>` 覆盖字体目录；默认用 `$SKILL/fonts/`。

```bash
# 抽关键帧，亲眼看版式与字幕带
NODE_PATH=$(npm root -g) node $SKILL/scripts/render-video.js video.html --stills=5,52,130,290,547

# 字幕自检：文本、压字、越界
NODE_PATH=$(npm root -g) node $SKILL/scripts/check-captions.js video.html
```

**自检不过不出片。** 常见不通过项：正文压进字幕带、图片超过 340px 高、长标题溢出画框、英文单词被粘在一起。

### 5 · 分段渲染 + 合并 + 挂音轨

```bash
NODE_PATH=$(npm root -g) node $SKILL/scripts/render-video.js video.html \
  --fps=25 --segment=60 --concurrency=6 --out=final.mp4
```

渲染器做四件事：

1. 按 `segment` 秒切段，段边界按整帧对齐
2. 每段独立截图、独立编码成 `seg-000.mp4`、`seg-001.mp4`……
3. 全部完成后 ffmpeg concat 无损合并
4. 合并后挂 `output.wav`（AAC 192k），导出同名 `.srt`

**断点续渲**：段文件存在且帧数正确就跳过。中途崩了重跑同一条命令，只补缺的段；`--force` 全部重来。

| 参数 | 说明 |
|---|---|
| `--fps=25` | 默认 25；60 只在真有快速运动时才值 |
| `--segment=60` | 分段长度；`0` = 不分段 |
| `--audio=` | 音轨；缺省读页面 `META.audio` 或同目录 `output.wav` |
| `--srt-out=` / `--no-srt` | 外挂字幕路径 / 不导出外挂字幕 |
| `--no-audio` | 只出画面 |
| `--from / --to` | 先渲一段看效果 |
| `--stills=1,5.2` | 只出静帧 |
| `--concurrency=6` | 段内并发 page 数 |
| `--crf=18` | x264 质量 |
| `--keep-frames / --keep-segments` | 保留中间产物排查 |

---

## 四、镜头类型

| type | 用来做什么 | 专属字段 |
|---|---|---|
| `cover` | 片头：标题、副标题、右侧结论、底部元信息 | `sub`、`side`、`sideTitle`、`meta` |
| `statement` | 抛主张 + 2–4 个关键词 | `keys: [{ i, t, d, cue }]` |
| `stats` | 2–4 个大数字；可计数、可带进度条 | `stats: [{ n, count, suffix, u, bar, cue }]` |
| `list` | 3–4 条要点，逐条展开 | `rows: [{ k, t, d, tag, cue }]` |
| `quote` | 引语、转场短句；衬线大字 | `quote: [行…]`、`quoteAt`、`cite`、`note` |
| `split` | 左右对照（得到/失去、之前/之后） | `cols: [{ h, big, p, li, tag, cue }]` |
| `flow` | 流程、回路、pipeline | `nodes: [{ i, t, d, hot, cue }]`、`loop`、`note` |
| `pillars` | 三根支柱 + 进度条 | `pillars: [{ h, t, d, l, r, bar, hot, cue }]` |
| `steps` | 两步落地路径 | `steps: [{ i, t, d, cue }]` |
| `compare` | 三列对照表 | `cols`、`rows: [{ cells, cue }]` |
| `bars` | 数量级对比条 | `bars: [{ t, s, v, bar, hot, cue }]` |
| `image` | 左文右图，图片遮罩揭示 | `big`、`p`、`img`、`cap`、`imgAt` |
| `summary` | 两组结论并排 | `groups: [{ h, items, cue }]` |
| `closing` | 片尾大字 + 一行落款 | `sub`、`subAt` |

一镜只用一个类型，一屏只有一个主角。`quote` 不渲染标题，引语就是主角。

---

## 五、视觉规范

画框固定 **1920×1080**，不要改。

- **版心**：左右 168px；顶栏 64px、分割线 114px；正文顶 176px、底线 844px
- **字幕带**：902–1080px，顶部一条 hairline；字幕**水平居中**；正文**不得**进入这条带
- **字号**：封面标题 112px / 正文标题 72px / 引语 64px / 数字 112px / 关键词 33px / 列表主标 29px / 步骤主标 38px / 副文案 19–22px / 标签 15–18px / 字幕 50px
- **颜色**：纸白 `#eff1f0`、墨黑 `#111413`、正文 `#22272c`、弱灰 `#6c7572`、强调橙 `#f74c00`、强调墨 `#bf3600`
- **层级靠字号与字重，不靠颜色**；hairline 分割代替阴影卡片，圆角一律 0
- **底部保留一条细分割线**：线右侧保留一个 mono 小标签（kicker 或 `footRight`），左侧不放注解；小字只做定位，不承载信息
- **水平排列的多列之间不加竖线**：用留白和字号分区，不要用竖分隔线把一屏切成条
- **文字块不加背景色**：高亮只用文字颜色，不加底色、不加卡片；底色和文字之间没有 padding，看起来一定脏
- **字体随片走**：`fonts/NotoSansCJK-VF.otf.ttc` 由 `build-video.js` 复制到输出目录并用 `@font-face` 内嵌；换机器不缺字
- **中文排印**：中英文之间留细空格；英文单词之间的普通空格必须保留；中文标点前不加空格；不修改 SRT 原文
- **不编数据**：没有就留诚实占位，或删掉那一镜；对比条必须注明「定性示意，非实测数值」

### 动效铁律：文字零位移

文字**只做** `opacity` + `clip-path`，绝不 `translate` / `scale` / `rotate`。位移会让文字停在非整数像素，缩放会让 Chromium 每帧重新栅格化字形，压成 H.264 后表现为文字抖动、边缘发毛。

- 标题：切镜时已经完整，不再逐行遮罩；避免切镜第一帧出现半截字形
- 段落/关键词：透明度 + 轻微 clip
- 数字：逐帧改 `textContent`（tabular-nums）
- 进度条：改 `width`
- 图片：`clip-path` 从下往上揭示
- 镜头切换：硬切；上一镜到点隐藏，下一镜立即接管
- 禁止 `transition` / `@keyframes` / CSS 动画；每帧样式由 `t` 全量算出

运动感来自：遮罩推进的节奏、逐条出现的次序、硬切带来的段落感，以及条/线/数字这些非文字元素。**不要靠文字位移。**

### 抖动自检

同一镜头内、揭示已完成的两个时间点，截图必须像素级一致：

```bash
NODE_PATH=$(npm root -g) node $SKILL/scripts/render-video.js video.html --stills=14.2,15.2
magick index-t14_20.png -crop 1300x300+160+200 +repage /tmp/a.png
magick index-t15_20.png -crop 1300x300+160+200 +repage /tmp/b.png
compare -metric AE /tmp/a.png /tmp/b.png null:      # 必须是 0
```

不为 0，说明画面里还有文字位移、CSS 动画，或者 GIF 在按墙钟播放。构建时 GIF 会被冻结成第一帧 PNG。

---

## 六、字幕

- **默认内嵌**：烧进画面底部字幕带，**水平居中**，播放器不可关
- **同时外挂**：渲染完成后自动写同名 `.srt`，与画面同源；改错别字或做多语言时不用重渲
- **断行**：单行 ≤26 个视觉字符（中文 1，ASCII 0.5）；一条字幕切多行时按字数比例分配时间，逐行显示
- **保持**：句尾多停 0.35s，但不越过下一句起点
- **文本**：SRT 原文不改字、不删句、不合句；只在渲染时插入中英文之间的细空格，并压掉中文标点前的多余空隙
- **空格**：英文单词之间的普通空格必须保留。分词时不要把空白 token 过滤掉，否则 `Niko Matsakis` 会粘成 `NikoMatsakis`；中英之间只补细空格，不碰英文内部
- **字体**：字幕用 `fonts/` 里的 Noto Sans CJK（可变字重），构建时内嵌，不依赖系统字体

字幕带高度 178px，50px 字幕两行足够（26px 起始 + 142px 两行 = 168px）。正文止于 844px，字幕带从 902px 开始。

---

## 七、验收清单

- [ ] `probe-project.js` 通过，音频与末句字幕时差 < 5s
- [ ] `SCENES` 的 cue / until 连续覆盖，不重叠、不跳号
- [ ] 未编排的尾部字幕走兜底后仍能看，不是空白
- [ ] `check-captions.js` 全绿（文本齐、没压正文、没越界）
- [ ] 抖动自检 `compare -metric AE` 为 0（同镜、揭示完成后的两个时间点）
- [ ] 每镜内容不超出画框，正文不进字幕带
- [ ] 中文排印：中英文之间一个细空格、英文单词之间保留普通空格、全角标点、无破折号
- [ ] 没有编造数字、引语、评价
- [ ] 成片帧数 = 时长 × fps（渲染器自动校验，不等就报错）
- [ ] 音轨存在且时长与画面一致
- [ ] 内嵌字幕在成片里可见；外挂 `.srt` 与 MP4 同名同目录
- [ ] 分段文件已合并清理，断点续渲可用

---

## 八、失败模式

- **字幕整体后移**：用了录屏渲染。必须走 `render-video.js` 的逐帧 seek
- **文字抖动 / 边缘发毛**：给文字加了 `transform`、`scale` 或 CSS 动画。改成 `clip-path` + `opacity`
- **字幕对不上画面**：画面里手写了秒数，或者 cue 用了 0-based。模板统一 1-based
- **字幕压住正文**：正文超过 844px，或图片高度超过 340px。改内容，不要缩字幕
- **图片闪烁 / 每帧不一样**：用了 GIF。构建时已冻结成 PNG；手写 HTML 时也要先转静帧
- **下一镜线条提前出现**：给镜头加了起镜前预显示，下一镜的横线/竖线先露头。切镜必须硬切，结构块再晚 60ms 出现
- **英文字幕粘连**：分词把空白 token 丢了。保留单词间空格，自检的归一化也只压成单空格
- **合并后时长不对**：分段边界没按整帧取整。用 `--segment` 让它自己算，别手写帧号
- **某段反复失败**：加 `--keep-frames` 看是截图空白还是字体没加载；删掉该段 mp4 重跑
- **中文字体缺失**：截图里全变方框。装 Noto Sans CJK，或改模板字体栈
- **音画不同步**：`output.wav` 与 SRT 不是同一版。先跑体检看时差，再决定重配还是重做字幕
- **全片都是兜底镜头**：没写 `SCENES` 或 cue 索引错位，对照 `srt2shots.js` 输出
- **一屏塞太多**：拆镜，不要缩字号
- **长镜头不拆**：超过 15 秒还在硬撑，观众会走神。让 `build-video.js` 自动拆，或用 `title1` / `title2` 手动分半
- **文字块加底色**：高亮块没有 padding，文字会贴边。只换文字颜色

---

## 命令速查

```bash
S=$SKILL

node $S/scripts/probe-project.js --audio=output.wav --srt=output.srt --html=index.html --slides=slides --images=images
node $S/scripts/srt2shots.js output.srt
node $S/scripts/build-video.js storyboard.js --srt=output.srt --out=video.html --images=images --audio=output.wav
NODE_PATH=$(npm root -g) node $S/scripts/render-video.js video.html --stills=3,52,130
NODE_PATH=$(npm root -g) node $S/scripts/check-captions.js video.html
NODE_PATH=$(npm root -g) node $S/scripts/render-video.js video.html --fps=25 --segment=60 --concurrency=6 --out=final.mp4
```

先出 30–60 秒样片验节奏：

```bash
NODE_PATH=$(npm root -g) node $S/scripts/render-video.js video.html \
  --from=0 --to=45 --segment=15 --out=sample.mp4
```
