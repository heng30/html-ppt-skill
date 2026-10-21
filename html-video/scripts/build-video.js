#!/usr/bin/env node
/**
 * build-video.js · 分镜 → 可渲染的视频 HTML
 *
 * 把 SRT、META 与 SCENES 注入 template/video.html，并把分镜里引用到的图片复制到
 * 输出目录的 assets/ 下。产物仍然零依赖、零 CDN，直接能双击预览。
 *
 * Usage:
 *   node scripts/build-video.js <storyboard.js> --srt=<file.srt> --out=<video.html> [--images=<dir>]
 *
 * storyboard.js 导出 { META, SCENES }（也接受 .json）。
 * 场景里的 img / note.img 写文件名即可，构建时从 --images 目录取。
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith('--' + name + '='));
  return p ? p.slice(name.length + 3) : def;
}

const SB = process.argv[2];
if (!SB || SB.startsWith('--')) {
  console.error('Usage: node scripts/build-video.js <storyboard.js> --srt=<file> --out=<video.html> [--images=<dir>] [--audio=<file>] [--fonts=<dir>]');
  process.exit(1);
}

const HERE = path.dirname(fs.realpathSync(__filename));
const SKILL = path.dirname(HERE);
const SB_ABS = path.resolve(SB);
const OUT = path.resolve(arg('out', path.join(path.dirname(SB_ABS), 'video.html')));
const IMAGES = arg('images', path.join(path.dirname(SB_ABS), 'images'));
const SRT = path.resolve(arg('srt', path.join(path.dirname(SB_ABS), 'output.srt')));
const TEMPLATE = path.resolve(arg('template', path.join(SKILL, 'template/video.html')));
const FONTS = path.resolve(arg('fonts', path.join(SKILL, 'fonts')));
const AUDIO = arg('audio', null);

for (const [label, p] of [['storyboard', SB_ABS], ['srt', SRT], ['template', TEMPLATE]]) {
  if (!fs.existsSync(p)) {
    console.error('✗ ' + label + ' 不存在: ' + p);
    process.exit(1);
  }
}

const sb = require(SB_ABS);
if (!sb || !Array.isArray(sb.SCENES) || !sb.SCENES.length) {
  console.error('✗ storyboard 没有导出 SCENES');
  process.exit(1);
}


const srt = fs.readFileSync(SRT, 'utf8').replace(/^\uFEFF/, '').replace(/<\/script/gi, '<\\/script');

// ---- 长镜头自动拆分：一屏内容不变超过 15 秒就会走神 ----
function parseSrtTimes(text) {
  const toSec = (x) => {
    const m = String(x).trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/);
    return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : null;
  };
  const out = [];
  for (const b of text.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = b.split('\n').filter((l) => l.trim());
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    const [a, z] = lines[ti].split('-->');
    const start = toSec(a), end = toSec(z);
    if (start == null || end == null) continue;
    out.push({ n: out.length + 1, start, end });
  }
  return out;
}

const TIMES = parseSrtTimes(srt);
const timeOf = (n) => (TIMES[Math.max(1, Math.min(TIMES.length, n | 0)) - 1] || { start: 0, end: 0 });

function itemField(sc) {
  if (sc.type === 'statement' && (sc.keys || []).length >= 4) return 'keys';
  if (sc.type === 'list' && (sc.rows || []).length >= 4) return 'rows';
  if (sc.type === 'flow' && (sc.nodes || []).length >= 4) return 'nodes';
  if (sc.type === 'compare' && (sc.rows || []).length >= 4) return 'rows';
  if (sc.type === 'bars' && (sc.bars || []).length >= 2) return 'bars';
  if (sc.type === 'steps' && (sc.steps || []).length >= 4) return 'steps';
  return null;
}

function splitLongScenes(scenes) {
  const out = [];
  for (const sc of scenes) {
    const cue = sc.cue | 0;
    const until = (sc.until == null ? sc.cue : sc.until) | 0;
    const dur = timeOf(until).end - timeOf(cue).start;
    const field = itemField(sc);
    if (dur > 15 && field) {
      const items = sc[field] || [];
      // 对半拆，避免出现只有一条内容的空镜
      let k = Math.max(1, Math.min(items.length - 1, Math.floor(items.length / 2)));
      const splitCue = items[k].cue | 0;
      if (splitCue > cue && splitCue <= until) {
        const a = Object.assign({}, sc, {
          until: splitCue - 1,
          title: sc.title1 != null ? sc.title1 : sc.title,
          lede: sc.lede1 != null ? sc.lede1 : sc.lede,
          [field]: items.slice(0, k),
        });
        const b = Object.assign({}, sc, {
          cue: splitCue,
          title: sc.title2 != null ? sc.title2 : sc.title,
          lede: sc.lede2 != null ? sc.lede2 : sc.lede,
          kicker: sc.kicker2 != null ? sc.kicker2 : sc.kicker,
          [field]: items.slice(k),
        });
        delete a.title1; delete a.title2; delete a.lede1; delete a.lede2; delete a.kicker1; delete a.kicker2;
        delete b.title1; delete b.title2; delete b.lede1; delete b.lede2; delete b.kicker1; delete b.kicker2;
        out.push(a, b);
        continue;
      }
    }
    out.push(sc);
  }
  return out;
}

const ORIGINAL_COUNT = sb.SCENES.length;
sb.SCENES = splitLongScenes(sb.SCENES);

// ---- 图片：复制到 assets/，分镜里的路径改成相对路径 ----
const OUT_DIR = path.dirname(OUT);
const ASSET_DIR = path.join(OUT_DIR, 'assets');
const copied = new Set();
function fixImg(p) {
  if (!p) return p;
  const base = path.basename(String(p));
  const src = path.isAbsolute(p) ? p : path.join(IMAGES, base);
  if (!fs.existsSync(src)) {
    console.warn('  ⚠ 图片不存在，跳过: ' + src);
    return p;
  }
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  // GIF 会按墙钟播放，逐帧渲染时每帧画面不一致。取第一帧转 PNG。
  const isGif = /\.gif$/i.test(src);
  const name = isGif ? base.replace(/\.gif$/i, '.png') : base;
  const dst = path.join(ASSET_DIR, name);
  if (!copied.has(name)) {
    if (isGif) {
      const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-frames:v', '1', dst], { encoding: 'utf8' });
      if (r.status !== 0) { console.warn('  ⚠ GIF 转静帧失败，改用原图: ' + src); fs.copyFileSync(src, dst); }
    } else fs.copyFileSync(src, dst);
    copied.add(name);
  }
  return 'assets/' + name;
}

for (const sc of sb.SCENES) {
  if (sc.img) sc.img = fixImg(sc.img);
  if (sc.note && sc.note.img) sc.note.img = fixImg(sc.note.img);
}

const meta = Object.assign({ tail: 0.3 }, sb.META || {});

// 音轨路径统一相对 video.html，渲染器就能直接找到
if (AUDIO) {
  const abs = path.resolve(AUDIO);
  meta.audio = path.relative(OUT_DIR, abs).split(path.sep).join('/') || path.basename(abs);
}

// 字幕字体：复制到输出目录，@font-face 用相对路径，换机器不缺字
const FONT_FILE = 'NotoSansCJK-VF.otf.ttc';
let fontHref = '';
if (fs.existsSync(path.join(FONTS, FONT_FILE))) {
  const d = path.join(OUT_DIR, 'fonts');
  fs.mkdirSync(d, { recursive: true });
  const dstFont = path.join(d, FONT_FILE);
  try { fs.chmodSync(dstFont, 0o644); } catch (e) {}
  fs.rmSync(dstFont, { force: true });
  fs.copyFileSync(path.join(FONTS, FONT_FILE), dstFont);
  fontHref = 'fonts/' + FONT_FILE;
} else {
  console.warn('  ⚠ 没找到字幕字体 ' + path.join(FONTS, FONT_FILE) + '，回退系统字体');
}

const tpl = fs.readFileSync(TEMPLATE, 'utf8');
const html = tpl
  .replace('__FONT_SANS__', () => fontHref)
  .replace('__SRT__', () => srt)
  .replace('__META__', () => JSON.stringify(meta, null, 2))
  .replace('__SCENES__', () => JSON.stringify(sb.SCENES, null, 2));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');

// ---- 覆盖检查：cue 区间连续、不重叠 ----
const scenes = sb.SCENES.slice().sort((a, b) => a.cue - b.cue);
const gaps = [];
for (let i = 1; i < scenes.length; i++) {
  const prevEnd = scenes[i - 1].until == null ? scenes[i - 1].cue : scenes[i - 1].until;
  if (scenes[i].cue !== prevEnd + 1) gaps.push(`${prevEnd + 1}–${scenes[i].cue - 1}`);
}
console.log('✓ ' + OUT);
console.log(`  ${ORIGINAL_COUNT} 镜 → ${scenes.length} 镜（长镜头自动拆分） · ${(html.length / 1024).toFixed(0)} KB · 图片 ${copied.size} 个 · 字体 ${fontHref ? '内嵌' : '系统'}`);
if (gaps.length) console.log('  ⚠ cue 区间未连续覆盖（会走兜底镜头）: ' + gaps.join(', '));
