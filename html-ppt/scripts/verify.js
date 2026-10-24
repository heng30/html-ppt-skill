#!/usr/bin/env node
// html-ppt 验收脚本：画框尺寸、组件齐全、溢出、截图与讲解稿页码。
// 用法：
//   NODE_PATH=$(npm root -g) node scripts/verify.js <输出目录|index.html> [选项]
// 选项：
//   --no-shots    跳过 slides/ 与 script.md 检查（只验版面）
//   --min N       最少页数（默认 8）
//   --max N       最多页数（默认 14）
// 退出码：0 通过 / 1 有问题 / 2 用法错误
// 依赖：playwright（NODE_PATH 指向全局 node_modules）
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('缺少 playwright：请用 NODE_PATH=$(npm root -g) node scripts/verify.js <dir> 运行');
  process.exit(2);
}
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const flag = name => args.includes(name);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : def;
};

if (!target) { console.error('usage: node scripts/verify.js <dir|index.html> [--no-shots] [--min N] [--max N]'); process.exit(2); }

const htmlPath = target.endsWith('.html') ? target : path.join(target, 'index.html');
const dir = path.dirname(htmlPath);
const checkShots = !flag('--no-shots');
const minPages = opt('--min', 8);
const maxPages = opt('--max', 14);

const errors = [];
const warns = [];
const push = (list, msg) => { if (!list.includes(msg)) list.push(msg); };

(async () => {
  if (!fs.existsSync(htmlPath)) {
    console.log(JSON.stringify({ ok: false, pages: 0, errors: [`缺少 ${path.relative(process.cwd(), htmlPath) || htmlPath}`], warns }, null, 1));
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');

  if (checkShots) {
    const urlFile = path.join(dir, 'url');
    if (!fs.existsSync(urlFile)) push(warns, '缺少 url 文件（批量模式要求记录原文链接）');
    else if (!fs.readFileSync(urlFile, 'utf8').trim()) push(errors, 'url 文件为空');
  }

  if (!/lang="zh-CN"/.test(html)) push(errors, 'html 缺少 lang="zh-CN"');
  if (/<iframe/i.test(html)) push(errors, '存在 iframe');
  if (/<link[^>]+manifest/i.test(html)) push(errors, '存在 manifest');
  if (/github\.min\.css|highlight\.js[^"']*\.css/i.test(html)) push(errors, '引入了第三方高亮主题 CSS');
  if (/——/.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''))) push(warns, 'HTML 中出现破折号 ——');

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1008, height: 640 }, deviceScaleFactor: 2 });
  const pageErrors = [];
  p.on('pageerror', e => pageErrors.push(String(e)));
  const badImgs = [];
  p.on('response', r => { if (r.status() >= 400) badImgs.push(r.url()); });
  await p.goto('file://' + path.resolve(htmlPath));
  await p.waitForTimeout(600);

  const info = await p.evaluate(() => {
    const slides = [...document.querySelectorAll('.slide')];
    slides.forEach((s, j) => { if (j !== 0) { s.style.display = 'flex'; s.classList.add('active'); } });
    const dims = slides.map((s, i) => {
      const r = s.getBoundingClientRect();
      const top = s.querySelector('.top');
      const foot = s.querySelector('.foot');
      const body = s.querySelector('.body');
      const rule = s.querySelector('.rule');
      return {
        i,
        w: Math.round(r.width),
        h: Math.round(r.height),
        sh: s.scrollHeight,
        sw: s.scrollWidth,
        top: !!top && (top.innerText || '').trim().length > 0,
        foot: !!foot && (foot.innerText || '').trim().length > 0,
        body: !!body,
        rule: !!rule,
        bodyH: body ? Math.round(body.getBoundingClientRect().height) : 0,
        codeOverflow: [...s.querySelectorAll('pre')].some(pre => pre.scrollWidth > pre.clientWidth + 2),
        codeNoLabel: [...s.querySelectorAll('.code-block')].some(cb => !cb.querySelector('.code-label')),
        codeNoLang: [...s.querySelectorAll('pre code')].some(c => ![...c.classList].some(cn => cn.startsWith('language-')))
      };
    });
    slides.forEach((s, j) => { if (j !== 0) { s.style.display = 'none'; s.classList.remove('active'); } });
    return {
      n: slides.length,
      indexes: slides.map(s => s.getAttribute('data-index')),
      title0: slides[0] ? slides[0].classList.contains('slide-title') : false,
      contentRest: slides.slice(1).every(s => s.classList.contains('slide-content')),
      dims,
      nav: !!document.querySelector('.navigation-bar'),
      dots: document.querySelectorAll('.nav-dot').length,
      imgs: [...document.images].map(img => ({ src: img.getAttribute('src'), ok: img.naturalWidth > 0 })),
    };
  });
  await b.close();

  if (pageErrors.length) push(errors, 'JS 报错: ' + pageErrors.join(' | '));
  if (info.n < minPages) push(errors, `页数过少: ${info.n}（要求 ${minPages}–${maxPages}）`);
  if (info.n > maxPages) push(errors, `页数过多: ${info.n}（要求 ${minPages}–${maxPages}）`);
  if (!info.nav) push(errors, '缺少 .navigation-bar');
  if (info.dots !== info.n) push(errors, `导航点数量 ${info.dots} 与页数 ${info.n} 不一致`);
  if (!info.title0) push(errors, '第 0 页缺少 .slide-title');
  if (!info.contentRest) push(errors, '第 1 页之后存在非 .slide-content 页面');
  info.indexes.forEach((v, i) => { if (String(i) !== String(v)) push(errors, `第 ${i} 个 .slide 的 data-index=${v}`); });

  info.dims.forEach(d => {
    if (Math.abs(d.w - 960) > 2) push(errors, `第 ${d.i} 页宽度 ${d.w}（应为 960）`);
    if (Math.abs(d.h - 540) > 1) push(errors, `第 ${d.i} 页高度 ${d.h}（应为 540）`);
    if (d.sh > 542) push(errors, `第 ${d.i} 页内容溢出: scrollHeight=${d.sh}`);
    if (d.sw > 962) push(errors, `第 ${d.i} 页横向溢出: scrollWidth=${d.sw}`);
    if (!d.top) push(errors, `第 ${d.i} 页 .top 缺失或为空`);
    if (!d.foot) push(errors, `第 ${d.i} 页 .foot 缺失或为空`);
    if (!d.rule) push(errors, `第 ${d.i} 页缺少 .rule`);
    if (!d.body && d.i > 0) push(warns, `第 ${d.i} 页未使用 .body 包裹（模板规范要求）`);
    if (d.codeOverflow) push(errors, `第 ${d.i} 页代码块出现横向滚动`);
    if (d.codeNoLabel) push(errors, `第 ${d.i} 页代码块缺少 .code-head / .code-label`);
    if (d.codeNoLang) push(errors, `第 ${d.i} 页 code 缺少 language-xxx`);
    if (d.i > 0 && d.bodyH > 0 && d.bodyH < 220) push(warns, `第 ${d.i} 页正文区偏矮 (${d.bodyH}px)，可能半页空白`);
  });

  info.imgs.filter(i => !i.ok).forEach(i => push(errors, '图片未加载: ' + i.src));
  badImgs.forEach(u => push(errors, '资源 404: ' + u));

  if (checkShots) {
    const slidesDir = path.join(dir, 'slides');
    const pngs = fs.existsSync(slidesDir) ? fs.readdirSync(slidesDir).filter(f => f.endsWith('.png')) : [];
    if (pngs.length < info.n) push(errors, `截图数量 ${pngs.length} 少于页数 ${info.n}（先跑 scripts/shot.js）`);

    const scriptPath = path.join(dir, 'script.md');
    if (!fs.existsSync(scriptPath)) push(errors, '缺少 script.md 讲解稿');
    else {
      const md = fs.readFileSync(scriptPath, 'utf8');
      for (let i = 0; i < info.n; i++) {
        if (!new RegExp(`第\\s*${i}\\s*页`).test(md)) push(errors, `script.md 缺少第 ${i} 页讲解`);
      }
      if (/——/.test(md)) push(errors, 'script.md 中出现破折号 ——');
      if (/本页我们来看|如图所示|综上所述|值得注意的是|不难发现|由此可见|这一页我们来看/.test(md)) push(errors, 'script.md 出现念稿腔用语');
    }
  }

  const ok = errors.length === 0;
  console.log(JSON.stringify({ ok, pages: info.n, errors, warns }, null, 1));
  console.error(ok ? `PASS ${info.n} 页${warns.length ? `，${warns.length} 条提醒` : ''}` : `FAIL ${errors.length} 个问题`);
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
