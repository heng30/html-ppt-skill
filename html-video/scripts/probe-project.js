#!/usr/bin/env node
/**
 * probe-project.js · 开工前体检
 *
 * 核对必需资源（音频 / SRT / 静态稿）与可选资源（图片 / 幻灯片截图），
 * 给出时长、cue 数、缺口与切镜建议。不做画面。
 *
 * Usage:
 *   node scripts/probe-project.js --audio=output.wav --srt=output.srt --html=index.html \
 *        [--slides=slides] [--images=images] [--json]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith('--' + name + '='));
  return p ? p.slice(name.length + 3) : def;
}
const JSON_OUT = process.argv.includes('--json');
const AUDIO = arg('audio', null);
const SRT = arg('srt', null);
const HTML = arg('html', null);
const SLIDES = arg('slides', null);
const IMAGES = arg('images', null);

function ts(s) {
  const m = String(s).trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}

function parseSRT(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
  const cues = [];
  for (const block of raw.split(/\n{2,}/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) continue;
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    const [a, b] = lines[ti].split('-->');
    const start = ts(a), end = ts(b);
    if (start == null || end == null) continue;
    cues.push({ n: cues.length + 1, start, end, text: lines.slice(ti + 1).join(' ').replace(/\s+/g, ' ').trim() });
  }
  return cues;
}

function audioDur(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
  return parseFloat((r.stdout || '0').trim()) || 0;
}

const result = { ok: true, problems: [], warnings: [] };
const req = (label, p, dir) => {
  const ok = p && fs.existsSync(p);
  if (!ok) { result.ok = false; result.problems.push(`缺${label}: ${p || '(未提供)'}`); }
  return ok;
};

let cues = [];
if (req('音轨', AUDIO)) result.audio = { file: AUDIO, seconds: +audioDur(AUDIO).toFixed(3) };
if (req('SRT', SRT)) {
  cues = parseSRT(SRT);
  result.srt = { file: SRT, cues: cues.length, lastEnd: +(cues[cues.length - 1] || {}).end?.toFixed(3) };
  if (!cues.length) { result.ok = false; result.problems.push('SRT 没有解析出任何 cue'); }
  // 时间轴健康度
  let gaps = 0, overlaps = 0;
  for (let i = 1; i < cues.length; i++) {
    const d = cues[i].start - cues[i - 1].end;
    if (d > 1.2) gaps++;
    if (d < -0.01) overlaps++;
  }
  result.srt.gaps = gaps;
  result.srt.overlaps = overlaps;
  if (overlaps) result.warnings.push(`SRT 有 ${overlaps} 处时间重叠`);
}
if (req('静态稿', HTML)) {
  const s = fs.readFileSync(HTML, 'utf8');
  result.html = { file: HTML, slides: (s.match(/class="slide\b/g) || []).length, bytes: s.length };
  if (!result.html.slides) result.warnings.push('静态稿里没识别到 .slide，仍可作视觉参考');
}
if (result.audio && result.srt) {
  const drift = result.audio.seconds - (result.srt.lastEnd || 0);
  result.drift = +drift.toFixed(3);
  if (Math.abs(drift) > 5) result.warnings.push(`音频与最后一条字幕差 ${drift.toFixed(2)}s，确认是否同一版配音`);
}
if (SLIDES && fs.existsSync(SLIDES)) {
  result.slides = fs.readdirSync(SLIDES).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).length;
  if (!result.slides) result.warnings.push('slides 目录里没有图片');
}
if (IMAGES && fs.existsSync(IMAGES)) {
  result.images = fs.readdirSync(IMAGES).filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
}

if (JSON_OUT) { console.log(JSON.stringify(result, null, 2)); process.exit(result.ok ? 0 : 1); }

const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x.toFixed(2).padStart(5, '0')}`;
};
console.log('▸ 项目体检');
if (result.audio) console.log(`  音轨 ${result.audio.file} · ${result.audio.seconds}s (${fmt(result.audio.seconds)})`);
if (result.srt) console.log(`  字幕 ${result.srt.cues} 条 · 末句 ${result.srt.lastEnd}s · 静默缺口 ${result.srt.gaps} 处`);
if (result.drift != null) console.log(`  音画时差 ${result.drift}s`);
if (result.html) console.log(`  静态稿 ${result.html.slides} 页 · ${(result.html.bytes / 1024).toFixed(0)} KB`);
if (result.slides != null) console.log(`  slides 截图 ${result.slides} 张`);
if (result.images) console.log(`  可选图片 ${result.images.length} 个: ${result.images.join(', ')}`);
for (const w of result.warnings) console.log('  ⚠ ' + w);
for (const p of result.problems) console.log('  ✗ ' + p);
if (result.ok) console.log('✓ 必需资源齐备');
process.exit(result.ok ? 0 : 1);
