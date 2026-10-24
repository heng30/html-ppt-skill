// html-ppt 批量流水线（prux SubagentWorkflow 用）
// 用法：SubagentWorkflow({ scriptPath: '<skill>/scripts/batch.workflow.js', args: {
//   base: '/绝对/输出根目录', items: [{ url, dir }], queue: 'urls.txt'  // queue 可省略
// }})
// 每条 URL 一个目录，目录内产出 index.html / script.md / shot.js / slides/ / url（有图再加 images/）。
// 每完成一条，verify 通过后由 done.py 把该 URL 从 queue 文件里原子删除。
export const meta = {
  name: 'html-ppt-batch',
  description: '批量把文章 URL 做成 html-ppt deck：每 URL 一个目录，生成后截图验收，通过即从队列移除',
  whenToUse: '一次要处理多条 URL、且希望失败项自动隔离时',
  phases: [
    { title: '生成', detail: '抓正文、选模板、写 index.html / script.md / shot.js / images' },
    { title: '收尾', detail: '截图、按 verify.js 修到全绿' },
  ],
}

const BASE = args.base
const SKILL = args.skill || '/home/blue/.prux/skills/html-ppt'
const QUEUE = args.queue ? (args.queue.startsWith('/') ? args.queue : `${BASE}/${args.queue}`) : null
const VERIFY = `${SKILL}/scripts/verify.js`
const SHOT = `${SKILL}/scripts/shot.js`

if (!BASE || !args.items || !args.items.length) throw new Error('args 需要 base 与 items[]')

function slugOf(url, i) {
  const s = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0].split('#')[0]
    .replace(/\/+$/, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${String(i + 1).padStart(2, '0')}-${s.slice(0, 60).replace(/-$/, '')}`
}
const items = args.items.map((it, i) => ({ url: it.url, dir: it.dir || slugOf(it.url, i) }))

function gateFor(item) {
  const parts = [`NODE_PATH=$(npm root -g) node ${VERIFY} ${BASE}/${item.dir}`]
  if (QUEUE) parts.push(`python3 ${SKILL}/scripts/done.py ${QUEUE} '${item.url.replace(/'/g, `'\\''`)}'`)
  return parts.join(' && ')
}

function buildPrompt(item) {
  return `你在一条批量生产流水线里，负责把一篇技术文章做成中文 HTML 幻灯片（deck）。你只负责制作，不负责验收。

工作目录（绝对路径，只允许在这个目录里写文件）：${BASE}/${item.dir}
文章 URL：${item.url}
先把这行 URL 原样写进 ${BASE}/${item.dir}/url（目录不存在就创建，url 文件不要带别的字符）。

第一步，先读规范：
1. ${SKILL}/SKILL.md 全文（硬规范，逐条遵守）
2. 判断模板后读对应组件文档：非代码文章读 ${SKILL}/ARTICLE-COMPONENTS.md，代码文章读 ${SKILL}/COMPONENTS.md
3. 对应模板：非代码 ${SKILL}/article-template/index.html，代码 ${SKILL}/coding-template.html

第二步，抓正文：
- 优先用 fetch_content 工具抓 ${item.url}
- 失败就用 bash curl，带 UA：curl -sSL -m 40 -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36" <url>
- GitHub blob 页面换成 raw.githubusercontent.com 对应地址；gist 用 /raw 后缀
- 仍失败可试 https://r.jina.ai/<url>
- 付费墙拿不到全文时，用能拿到的部分，绝不编造内容

第三步，图片：
- 只下载正文里有信息价值的插图 3 到 8 张（排除头像、图标、广告、装饰图）
- 存到 ${BASE}/${item.dir}/images/，命名 img-01.jpg、img-02.png（保持原后缀）
- 用 curl 带 UA 下载，相对路径补全为绝对 URL，单张超时 30 秒
- 抓不到图就跳过，不要用占位图

第四步，判断模板（只选一套，不许混用）：
- 可展示的代码段 >= 3 段，或核心论点靠代码/API/配置支撑 → 代码模板 coding-template.html
- 其余一律非代码模板 article-template/index.html

第五步，产出：
A. index.html
   - 复制对应模板后整页替换内容，保留 :root 变量、基础版式、.navigation-bar HTML 与底部 JS
   - 单文件自包含，<html lang="zh-CN">，全文中文（英文原文要翻译）
   - 960×540 固定画框，8 到 14 页；第 0 页 .slide-title 作封面，第 1 页起 .slide-content
   - 每页 .slide 带 data-index，从 0 连续
   - 每页 .top + .rule + .foot 齐全，主体用 .body 包裹并靠 flex:1 填满；页脚两侧都不能空
   - 页面局部样式写在 <style> 里并用 #pNN 作用域，不许污染其他页
   - 单一强调色（非代码模板 --signal 橙；代码模板 --accent 靛蓝），每页强调 <= 3 处
   - 禁止圆角卡片、投影、渐变、左彩条、logo 墙、编造数据和评价；不用破折号，中英文之间留一个空格
   - 代码模板：每个代码块要 .code-block 外壳 + .code-head + .code-dots + .code-label，标 language-xxx，5 到 14 行，单行 <= 80 字符，HTML 实体转义，一页最多一个代码块；代码必须真实可运行，能用 rustc/node/python 验证的至少语法检查一次
   - 非代码模板不写代码块，函数名用 <span class="mono">
   - 图表必须有坐标轴/单位/口径，非实测要标「定性示意，非实测数值」
B. script.md
   - 逐页口播稿：每页一段，标题格式「## 第 N 页 · 小标题」，N 与 data-index 严格对应
   - 第 0 页 80 到 150 字，常规页 120 到 200 字，重点页 200 到 300 字，末页 150 到 250 字
   - 第二人称、短句、每页至少一个真问题；不用「本页」「如图所示」「综上所述」「值得注意的是」；不用破折号
   - 数字口语化，术语第一次出现带半句解释

不要做的事：
- 不要截图，不要跑 ${VERIFY}（下一个环节负责）
- 不要改 url 文件内容，不要 git 操作，不要写这个目录以外的文件

完成后用 5 行以内汇报：用了哪套模板、多少页、抓到几张图、抓取过程有没有遇到问题。`
}

function finishPrompt(item) {
  return `你负责给一个已做好的中文 HTML 幻灯片收尾并验收，工作目录：${BASE}/${item.dir}

步骤：
1. cd 到该目录，确认 index.html、script.md 存在，mkdir -p slides
2. 截图：NODE_PATH=$(npm root -g) node ${SHOT} ${BASE}/${item.dir}
3. 验收：NODE_PATH=$(npm root -g) node ${VERIFY} ${BASE}/${item.dir}
   它会输出 JSON，包含 ok、pages、errors、warns
4. 把 ok 修成 true，errors 清零，warns 也尽量清零（尤其 .body 缺失、正文区偏矮、破折号、页数偏离 8 到 14）
5. 改完 HTML 后必须重跑 shot.js 再重跑 verify.js，直到全绿

常见问题与正确修法（照规范，不许缩字号硬塞）：
- 页高超过 540 / scrollHeight 超 542：内容超载，拆页或把代码精简到 5 到 14 行、缩短 .dek、图片改并排；图片 max-height 调小
- 半页空白（.body 太矮）：补一个表格、一组数字、一段 .rows 或一句结论，不许拉大留白
- 缺 .body：给该页内容套 <div class="body">，靠 flex:1 撑满
- 截图数量少于页数：重跑 shot.js
- script.md 缺某页讲解或出现念稿腔/破折号：重写那一段
- 图片 404：确认图片在 images/ 下且路径是相对路径 images/img-XX.ext
- 代码块横向滚动或缺少 .code-label / language-xxx：按规范补外壳与语言标注
- data-index 不连续：按顺序重排

只改这个目录里的文件，不改 url 文件，不 git 操作。最后用 3 行以内汇报：最终页数、verify 是否 ok、修了哪些问题。`
}

phase('生成')
const results = await pipeline(
  items,
  item => agent(buildPrompt(item), { label: `build-${item.dir.slice(0, 24)}`, phase: '生成' }),
  (prev, item) => agent(finishPrompt(item), {
    label: `finish-${item.dir.slice(0, 24)}`,
    phase: '收尾',
    gate: gateFor(item),
  })
)

return items.map((item, i) => ({
  dir: item.dir,
  url: item.url,
  ok: !!results[i],
  note: results[i] ? String(results[i]).split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 400) : 'FAILED',
}))
