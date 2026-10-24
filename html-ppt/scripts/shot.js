#!/usr/bin/env node
// html-ppt 逐页截图：960×540 画框，1008 视口 + deviceScaleFactor 2 → 1920×1080 PNG。
// 用法：NODE_PATH=$(npm root -g) node scripts/shot.js [输出目录] [--prefix slide]
// 输出：<目录>/slides/<prefix>-1.png, -2.png ...
// 说明：html-screenshot 渲染异常时（页面变高、竖版、布局错乱）用这个兜底。
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('缺少 playwright：请用 NODE_PATH=$(npm root -g) node scripts/shot.js <dir> 运行');
  process.exit(2);
}
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.');
const pi = args.indexOf('--prefix');
const prefix = pi >= 0 && args[pi + 1] ? args[pi + 1] : 'slide';
const htmlPath = path.join(dir, 'index.html');

if (!fs.existsSync(htmlPath)) { console.error('找不到 ' + htmlPath); process.exit(2); }
fs.mkdirSync(path.join(dir, 'slides'), { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1008, height: 640 }, deviceScaleFactor: 2 });
  await p.goto('file://' + htmlPath);
  await p.waitForTimeout(500);
  const n = await p.$$eval('.slide', s => s.length);
  for (let i = 0; i < n; i++) {
    await p.evaluate(i => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.style.display = j === i ? 'flex' : 'none';
        s.classList.toggle('active', j === i);
      });
    }, i);
    await p.waitForTimeout(60);
    await p.locator('.slide').nth(i).screenshot({ path: path.join(dir, 'slides', `${prefix}-${i + 1}.png`) });
  }
  await b.close();
  console.log('done', n, '张 →', path.join(dir, 'slides'));
})().catch(e => { console.error(e); process.exit(1); });
