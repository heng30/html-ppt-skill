#!/usr/bin/env node
/**
 * render-video.js · HTML 时间轴 → MP4（逐帧 seek，分段渲染，最后合并并挂音轨）
 *
 * 为什么必须逐帧 seek：录屏走实时时钟，掉帧和启动延迟会让画面整体漂移，字幕必然
 * 对不上。这里冻结页面时钟，每帧调用 window.__seek(t) 截图，同输入同输出。
 *
 * 分段：长片按 --segment 秒切成若干段，每段独立截图、独立编码，最后 concat 无损
 * 合并；段边界按整帧对齐。已存在且帧数正确的段会跳过（断点续渲）。合并后再把
 * 音频挂上去，并与页面时间轴校验总时长。
 *
 * 页面约定：
 *   window.__ready           DOM 就绪
 *   window.__seek(t)         t 秒时的完整画面（纯函数，只依赖 t）
 *   window.__totalDuration   总时长
 *   window.__cues            SRT cue 列表（用于导出外挂字幕）
 *   window.__audio           可选，音轨路径
 *
 * Usage:
 *   NODE_PATH=$(npm root -g) node scripts/render-video.js <video.html> [options]
 *
 * Options:
 *   --fps=25              帧率，默认 25
 *   --segment=60          分段长度秒数，0 = 不分段
 *   --from / --to         只渲染区间
 *   --stills=1,5.2        只出静帧
 *   --audio=<file>        音轨；缺省读页面 __audio，或 HTML 同目录的 output.wav
 *   --no-audio            不挂音轨
 *   --out=<file.mp4>      输出
 *   --srt-out=<file.srt>  外挂字幕输出；--no-srt 关闭
 *   --concurrency=6       段内并发 page 数
 *   --crf=18              x264 质量
 *   --force               全部重渲
 *   --keep-frames / --keep-segments
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith('--' + name + '='));
  return p ? p.slice(name.length + 3) : def;
}
const has = (n) => process.argv.includes('--' + n);

const HTML = process.argv[2];
if (!HTML || HTML.startsWith('--')) {
  console.error('Usage: node scripts/render-video.js <video.html> [--fps=25] [--segment=60] [--audio=file.wav] [--out=out.mp4]');
  process.exit(1);
}

const HTML_ABS = path.resolve(HTML);
const BASE = path.basename(HTML, path.extname(HTML));
const DIR = path.dirname(HTML_ABS);
const FPS = parseFloat(arg('fps', '25'));
const SEGMENT = parseFloat(arg('segment', '60'));
const WIDTH = parseInt(arg('width', '1920'), 10);
const HEIGHT = parseInt(arg('height', '1080'), 10);
const CONCURRENCY = Math.max(1, parseInt(arg('concurrency', '6'), 10));
const CRF = arg('crf', '18');
const OUT = path.resolve(arg('out', path.join(DIR, BASE + '.mp4')));
const STILLS = arg('stills', null);
const FORCE = has('force');
const KEEP_FRAMES = has('keep-frames');
const KEEP_SEGMENTS = has('keep-segments');
const WRITE_SRT = !has('no-srt');
const AUDIO_ARG = arg('audio', null);
const NO_AUDIO = has('no-audio');
const WORK = path.join(DIR, '.render-' + BASE);

const ENCODE = [
  '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF,
  '-pix_fmt', 'yuv420p', '-g', String(Math.round(FPS * 2)),
  '-movflags', '+faststart',
];
const say = (s) => console.log(s);

async function waitRaf(page, n) {
  await page.evaluate((count) => new Promise((res) => {
    let i = 0;
    const step = () => { i += 1; i >= count ? res() : requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), n);
}

async function openPage(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(
    () => window.__ready === true && typeof window.__seek === 'function',
    { timeout: 20000 },
  );
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));
  await waitRaf(page, 2);
  return page;
}

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_frames,width,height,r_frame_rate:format=duration',
    '-of', 'json', file], { encoding: 'utf8' });
  try {
    const j = JSON.parse(r.stdout);
    const s = (j.streams || [])[0] || {};
    return { frames: parseInt(s.nb_frames || '0', 10), dur: parseFloat((j.format || {}).duration || '0'), w: s.width, h: s.height };
  } catch (e) {
    return null;
  }
}

function probeAudio(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
  return parseFloat((r.stdout || '0').trim()) || 0;
}

(async () => {
  if (!fs.existsSync(HTML_ABS)) {
    console.error('✗ HTML 不存在: ' + HTML_ABS);
    process.exit(1);
  }
  fs.mkdirSync(WORK, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    window.__recording = true;
    window.__seekRender = true;
  });
  await context.addInitScript(() => {
    const css = '.no-record,[data-record="hidden"]{display:none !important}';
    const inject = () => {
      const s = document.createElement('style');
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject, { once: true });
    } else inject();
  });

  const url = 'file://' + HTML_ABS;

  // ---- stills：静帧对轴 ----
  if (STILLS) {
    const times = STILLS.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    const page = await openPage(context, url);
    for (const t of times) {
      await page.evaluate((tt) => window.__seek(tt), t);
      await waitRaf(page, 2);
      const out = path.join(DIR, `${BASE}-t${t.toFixed(2).replace('.', '_')}.png`);
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      say('  still ' + t.toFixed(2) + 's → ' + path.basename(out));
    }
    await browser.close();
    say('✓ ' + times.length + ' 张静帧');
    return;
  }

  const probePage = await openPage(context, url);
  const total = await probePage.evaluate(() => window.__totalDuration || 0);
  const cues = await probePage.evaluate(() => window.__cues || []);
  const pageAudio = await probePage.evaluate(() => window.__audio || null);
  const shots = await probePage.evaluate(() => window.__shotCount || 0);
  await probePage.close();

  const from = parseFloat(arg('from', '0'));
  const toArg = arg('to', null);
  const durArg = arg('duration', null);
  const to = toArg != null ? parseFloat(toArg)
    : durArg != null ? from + parseFloat(durArg)
    : total > 0 ? total : from + 30;

  if (!(to > from)) {
    console.error(`✗ 时间区间无效: from=${from} to=${to}`);
    process.exit(1);
  }

  // ---- 外挂字幕（默认写，与画面同源） ----
  function pad(n, w) { return String(n).padStart(w, '0'); }
  function srtTime(sec) {
    const ms = Math.max(0, Math.round(sec * 1000));
    return pad(Math.floor(ms / 3600000), 2) + ':' + pad(Math.floor((ms % 3600000) / 60000), 2) +
      ':' + pad(Math.floor((ms % 60000) / 1000), 2) + ',' + pad(ms % 1000, 3);
  }
  if (WRITE_SRT) {
    const srtPath = path.resolve(arg('srt-out', OUT.replace(/\.mp4$/i, '') + '.srt'));
    const kept = cues
      .map((c) => ({ start: Math.max(from, c.start) - from, end: Math.min(to, c.end) - from, text: c.text }))
      .filter((c) => c.end - c.start > 0.01);
    if (kept.length) {
      const body = kept.map((c, i) =>
        (i + 1) + '\n' + srtTime(c.start) + ' --> ' + srtTime(c.end) + '\n' + c.text,
      ).join('\n\n');
      fs.writeFileSync(srtPath, body + '\n', 'utf8');
      say(`  外挂字幕 ${kept.length} 条 → ${path.basename(srtPath)}`);
    } else say('  ⚠ 区间内没有字幕，未写 .srt');
  }

  // ---- 音轨：命令行 > 页面 META.audio > 同目录 output.wav ----
  let audioPath = null;
  if (!NO_AUDIO) {
    const cand = AUDIO_ARG
      ? path.resolve(AUDIO_ARG)
      : pageAudio ? path.resolve(DIR, pageAudio)
        : ['output.wav', 'output.mp3', 'audio.wav', 'audio.mp3'].map((f) => path.join(DIR, f)).find((f) => fs.existsSync(f));
    if (cand && fs.existsSync(cand)) audioPath = cand;
    else if (AUDIO_ARG) { console.error('✗ 音轨不存在: ' + cand); process.exit(1); }
  }

  const f0 = Math.round(from * FPS);
  const f1 = Math.round(to * FPS);
  const totalFrames = f1 - f0;
  const segFrames = SEGMENT > 0 ? Math.max(1, Math.round(SEGMENT * FPS)) : totalFrames;

  const segs = [];
  for (let a = f0; a < f1; a += segFrames) segs.push({ from: a, to: Math.min(a + segFrames, f1) });
  const segOut = (i) => path.join(WORK, 'seg-' + String(i).padStart(3, '0') + '.mp4');

  say(`▸ ${BASE}  ${WIDTH}×${HEIGHT} · ${FPS}fps · ${shots} 镜 · ${from.toFixed(2)}–${to.toFixed(2)}s · ${totalFrames} 帧`);
  say(`  分段 ${segs.length} 段${segs.length > 1 ? '（每段 ' + SEGMENT + 's）' : '（不分段）'} · 段内 ${CONCURRENCY} 并发`);
  say(`  音轨 ${audioPath ? path.basename(audioPath) + ' (' + probeAudio(audioPath).toFixed(3) + 's)' : '无'}`);

  async function renderSegment(i, seg) {
    const out = segOut(i);
    const count = seg.to - seg.from;
    const expect = count / FPS;
    const exist = fs.existsSync(out) ? probe(out) : null;
    if (!FORCE && exist && exist.frames === count && Math.abs(exist.dur - expect) < 0.2) {
      say(`  段 ${i + 1}/${segs.length} 已存在，跳过（${exist.frames} 帧）`);
      return;
    }

    const frameDir = path.join(WORK, 'frames-' + String(i).padStart(3, '0'));
    fs.rmSync(frameDir, { recursive: true, force: true });
    fs.mkdirSync(frameDir, { recursive: true });
    const fileOf = (f) => path.join(frameDir, 'f-' + String(f).padStart(7, '0') + '.png');

    const frames = [];
    for (let f = seg.from; f < seg.to; f++) frames.push(f);
    const buckets = Array.from({ length: CONCURRENCY }, () => []);
    frames.forEach((f, k) => buckets[k % CONCURRENCY].push(f));
    let done = 0;

    async function worker(list) {
      if (!list.length) return;
      const page = await openPage(context, url);
      for (const f of list) {
        await page.evaluate((tt) => window.__seek(tt), f / FPS);
        await waitRaf(page, 2);
        await page.screenshot({ path: fileOf(f), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
        done++;
        if (done % 250 === 0) say(`     … ${done}/${frames.length} 帧`);
      }
      await page.close();
    }

    const t0 = Date.now();
    try {
      await Promise.all(buckets.map(worker));
    } catch (e) {
      console.error(`✗ 段 ${i + 1} 截图失败: ` + (e && e.message ? e.message : e));
      return;
    }

    const tmpOut = out + '.part.mp4';
    const r = spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(FPS),
      '-start_number', String(seg.from),
      '-i', path.join(frameDir, 'f-%07d.png'),
      '-frames:v', String(count),
      ...ENCODE, tmpOut,
    ], { encoding: 'utf8' });

    if (r.status !== 0 || !fs.existsSync(tmpOut)) {
      console.error(`✗ 段 ${i + 1} 编码失败:\n` + (r.stderr || '').slice(-1500));
      return;
    }
    fs.renameSync(tmpOut, out);
    if (!KEEP_FRAMES) fs.rmSync(frameDir, { recursive: true, force: true });
    say(`  段 ${i + 1}/${segs.length}  帧 ${seg.from}–${seg.to - 1}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  for (let i = 0; i < segs.length; i++) {
    await renderSegment(i, segs[i]);
    if (!fs.existsSync(segOut(i))) {
      console.error(`✗ 段 ${i + 1} 缺失，终止（修好后重跑会从断点继续）`);
      await browser.close();
      process.exit(1);
    }
  }
  await browser.close();

  // ---- 合并分段 ----
  const silent = path.join(WORK, 'silent.mp4');
  if (segs.length === 1) {
    fs.copyFileSync(segOut(0), silent);
  } else {
    const listFile = path.join(WORK, 'concat.txt');
    fs.writeFileSync(listFile, segs.map((s, i) => "file '" + segOut(i).replace(/'/g, "'\\''") + "'").join('\n'), 'utf8');
    say(`▸ 合并 ${segs.length} 段`);
    let r = spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy', '-movflags', '+faststart',
      '-avoid_negative_ts', 'make_zero',
      silent,
    ], { encoding: 'utf8' });
    if (r.status !== 0) {
      say('  无损合并失败，回退重编码合并');
      r = spawnSync('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'concat', '-safe', '0', '-i', listFile,
        ...ENCODE, silent,
      ], { encoding: 'utf8' });
    }
    if (r.status !== 0) {
      console.error('✗ 合并失败:\n' + (r.stderr || '').slice(-1500));
      process.exit(1);
    }
    if (!KEEP_SEGMENTS) {
      for (let i = 0; i < segs.length; i++) fs.rmSync(segOut(i), { force: true });
      fs.rmSync(listFile, { force: true });
    }
  }

  // ---- 挂音轨：视频流 copy，音频 AAC；用 apad 补齐视频尾部 ----
  if (audioPath) {
    say('▸ 挂音轨 → ' + path.basename(OUT));
    const r = spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', silent, '-i', audioPath,
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-af', 'apad', '-t', String((to - from).toFixed(3)),
      '-movflags', '+faststart', OUT,
    ], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error('✗ 挂音轨失败:\n' + (r.stderr || '').slice(-1500));
      process.exit(1);
    }
    fs.rmSync(silent, { force: true });
  } else {
    fs.copyFileSync(silent, OUT);
    fs.rmSync(silent, { force: true });
  }

  // ---- 校验 ----
  const meta = probe(OUT);
  const expectFrames = totalFrames;
  const ok = meta && Math.abs(meta.dur - expectFrames / FPS) < 0.25;
  say('✓ ' + OUT);
  if (meta) say(`  ${meta.w}×${meta.h} · ${meta.dur.toFixed(2)}s · ${meta.frames || '?'} 帧（期望 ${expectFrames} 帧 / ${(expectFrames / FPS).toFixed(2)}s）`);
  if (!ok) {
    console.error('✗ 成片时长与时间轴不符，检查分段边界');
    process.exit(1);
  }
})().catch((e) => {
  console.error('✗ ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
