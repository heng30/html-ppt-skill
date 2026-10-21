#!/usr/bin/env node
/**
 * check-captions.js · 内嵌字幕自检
 *
 * 对每条字幕取三个采样点，读画面上真正显示的字幕，与 SRT 原文比对；同时检查
 * 字幕带有没有压住正文、字幕有没有超出画框。页面逐帧 seek 渲染，DOM 通过即视频通过。
 *
 * Usage:
 *   NODE_PATH=$(npm root -g) node scripts/check-captions.js <video.html> [--tol=0.03]
 *
 * 退出码 0 = 全部通过。
 */
const { chromium } = require('playwright');
const path = require('path');

const HTML = process.argv[2];
if (!HTML || HTML.startsWith('--')) {
  console.error('Usage: node scripts/check-captions.js <video.html>');
  process.exit(1);
}
const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { window.__recording = true; window.__seekRender = true; });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(HTML), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true && typeof window.__seek === 'function', { timeout: 20000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));

  const cues = await page.evaluate(() => window.__cues);
  if (!cues || !cues.length) {
    console.error('✗ 页面没有暴露 window.__cues');
    process.exit(1);
  }

  const bad = [];
  const overlap = [];
  const overflow = [];

  for (const c of cues) {
    const dur = c.end - c.start;
    const points = [c.start + Math.min(0.05 + dur * 0.15, dur * 0.5), c.start + dur * 0.5, c.end - dur * 0.15];
    for (const t of points) {
      const r = await page.evaluate((tt) => {
        window.__seek(tt);
        const line = document.getElementById('cap-line');
        const band = document.getElementById('capband');
        const capRect = line.getBoundingClientRect();
        const bandRect = band.getBoundingClientRect();
        const shown = line.textContent || '';
        const op = parseFloat(getComputedStyle(line).opacity || '1');
        let contentBottom = 0;
        let contentRight = 0;
        document.querySelectorAll('.shot').forEach((sh) => {
          if (getComputedStyle(sh).visibility === 'hidden') return;
          if (parseFloat(getComputedStyle(sh).opacity || '1') < 0.6) return;
          sh.querySelectorAll('.sk,h2.t,.lede,.cv-kicker,.cv-title,.cv-sub,.cv-side,.cv-meta,.keys,.rows,.split,.qt,.stat,.stats,.pillars,.steps,.cmp,.bars,.imgshot,.sum,.close .big,.close .sub,.flow,.flow-note').forEach((el) => {
            if (!el.textContent || !el.textContent.trim()) return;
            const b = el.getBoundingClientRect();
            if (b.height < 2) return;
            if (b.bottom > contentBottom) contentBottom = b.bottom;
            if (b.right > contentRight) contentRight = b.right;
          });
        });
        return {
          shown, op,
          gap: bandRect.top - contentBottom,
          bandTop: bandRect.top,
          capBottom: capRect.bottom,
          contentRight,
          scrollW: document.documentElement.scrollWidth,
        };
      }, t);

      const want = norm(c.text);
      const got = norm(r.shown);
      if (r.op < 0.4 || !got) bad.push({ i: c.n, t: +t.toFixed(2), why: '字幕缺失', want: c.text });
      else if (want.indexOf(got) < 0) bad.push({ i: c.n, t: +t.toFixed(2), why: '字幕文本不符', want: c.text, got: r.shown });
      if (r.gap < 10) overlap.push({ i: c.n, t: +t.toFixed(2), gap: +r.gap.toFixed(1) });
      if (r.capBottom > 1072 || r.contentRight > 1912) overflow.push({ i: c.n, t: +t.toFixed(2), bottom: +r.capBottom.toFixed(1), right: +r.contentRight.toFixed(1) });
    }
  }

  await browser.close();

  console.log(`▸ 内嵌字幕自检：${cues.length} 条 × 3 个采样点 = ${cues.length * 3} 次`);
  console.log(bad.length ? `  ✗ ${bad.length} 处字幕不符` : '  ✓ 所有采样点显示的字幕都属于该句原文');
  for (const b of bad.slice(0, 20)) {
    console.log(`    cue ${b.i} @${b.t}s ${b.why}`);
    console.log(`      期望含: ${b.want}`);
    if (b.got) console.log(`      实际:   ${b.got}`);
  }
  console.log(overlap.length ? `  ⚠ ${overlap.length} 处字幕带贴近正文（<10px）：` + overlap.slice(0, 10).map((o) => `cue ${o.i}@${o.t}(${o.gap}px)`).join(', ') : '  ✓ 字幕带没有压住正文');
  if (overflow.length) console.log(`  ⚠ ${overflow.length} 处越界：` + overflow.slice(0, 10).map((o) => `cue ${o.i}@${o.t}(b:${o.bottom},r:${o.right})`).join(', '));
  else console.log('  ✓ 字幕没有超出画框');
  process.exit(bad.length ? 1 : 0);
})().catch((e) => {
  console.error('✗ ' + (e && e.message ? e.message : e));
  process.exit(1);
});
