#!/usr/bin/env node
/**
 * srt2shots.js · SRT 字幕 → 分镜建议（cue 清单 + 自动分组 + 时间轴总长）
 *
 * 视频模板以 SRT 为唯一时间源：字幕层严格按 SRT 绝对时间显示，画面按 cue 索引
 * 绑定到字幕。本脚本不做画面，只把 SRT 拆成「可以直接照抄进 SCENES 的 cue 索引区间」。
 *
 * Usage:
 *   node scripts/srt2shots.js <file.srt> [--json] [--maxlen=3] [--gap=1.2] [--screen=11]
 *
 * Options:
 *   --json      输出机器可读 JSON（默认输出 md 表格）
 *   cue 序号按 SRT 序号（1-based）输出，直接抄进 SCENES
 *   --maxlen    每个镜头最多几条字幕，默认 3
 *   --gap       句间静默超过多少秒就换镜头，默认 1.2
 *   --screen    单个镜头最长秒数，默认 11
 *
 * 输出 md 里每个镜头给出 { cue: 起, until: 止 } 两个数，直接填进模板的 SCENES。
 */
const fs = require('fs');

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith('--' + name + '='));
  return p ? p.slice(name.length + 3) : def;
}
const FILE = process.argv[2];
if (!FILE || FILE.startsWith('--')) {
  console.error('Usage: node scripts/srt2shots.js <file.srt> [--json] [--maxlen=3] [--gap=1.2] [--screen=11]');
  process.exit(1);
}
const JSON_OUT = process.argv.includes('--json');
const MAXLEN = parseInt(arg('maxlen', '3'), 10);
const GAP = parseFloat(arg('gap', '1.2'));
const SCREEN = parseFloat(arg('screen', '11'));

function ts(s) {
  const m = s.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}

const raw = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
const cues = [];
for (const block of raw.split(/\n{2,}/)) {
  const lines = block.split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) continue;
  const timeIdx = lines.findIndex((l) => l.includes('-->'));
  if (timeIdx < 0) continue;
  const [a, b] = lines[timeIdx].split('-->');
  const start = ts(a);
  const end = ts(b);
  if (start == null || end == null) continue;
  const text = lines.slice(timeIdx + 1).join(' ').replace(/\s+/g, ' ').trim();
  cues.push({ i: cues.length, start, end, text });
}

if (!cues.length) {
  console.error('✗ 没解析出任何字幕，检查 SRT 格式');
  process.exit(1);
}

// ---- 自动分组：间隙 / 句数 / 单屏时长 三个条件任一满足就切 ----
const shots = [];
let cur = [0];
for (let i = 1; i < cues.length; i++) {
  const prev = cues[i - 1];
  const c = cues[i];
  const gap = c.start - prev.end;
  const span = c.end - cues[cur[0]].start;
  if (gap >= GAP || cur.length >= MAXLEN || span >= SCREEN) {
    shots.push(cur);
    cur = [i];
  } else {
    cur.push(i);
  }
}
shots.push(cur);

const total = cues[cues.length - 1].end;

function fmt(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`;
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    file: FILE,
    totalDuration: +total.toFixed(3),
    cueCount: cues.length,
    shotCount: shots.length,
    cues,
    shots: shots.map((g, k) => ({
      shot: k,
      cue: g[0] + 1,
      until: g[g.length - 1] + 1,
      start: +cues[g[0]].start.toFixed(3),
      end: +cues[g[g.length - 1]].end.toFixed(3),
      secs: +(cues[g[g.length - 1]].end - cues[g[0]].start).toFixed(2),
      text: g.map((i) => cues[i].text).join(' / '),
    })),
  }, null, 2));
  process.exit(0);
}

console.log(`# ${FILE}`);
console.log(`\n字幕 ${cues.length} 条 · 建议 ${shots.length} 镜 · 总长 ${fmt(total)}（${total.toFixed(2)}s）\n`);
console.log('| 镜 | cue | until | 起 | 止 | 秒 | 字幕 |');
console.log('|---|---|---|---|---|---|---|');
shots.forEach((g, k) => {
  const a = cues[g[0]];
  const b = cues[g[g.length - 1]];
  const text = g.map((i) => cues[i].text).join(' ／ ');
  console.log(`| ${k} | ${g[0] + 1} | ${g[g.length - 1] + 1} | ${a.start.toFixed(2)} | ${b.end.toFixed(2)} | ${(b.end - a.start).toFixed(1)} | ${text} |`);
});
console.log('\n# cue 明细\n');
console.log('| cue | 起 | 止 | 字 | 字幕 |');
console.log('|---|---|---|---|---|');
for (const c of cues) {
  console.log(`| ${c.i + 1} | ${c.start.toFixed(2)} | ${c.end.toFixed(2)} | ${c.text.length} | ${c.text} |`);
}
