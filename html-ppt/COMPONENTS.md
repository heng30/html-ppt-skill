# 组件词汇表

代码模板 [`coding-template.html`](coding-template.html) 的组件参考。类名只许用本文件出现过的，样式只许从模板整段复制。

非代码文章使用另一套模板，见 [`ARTICLE-COMPONENTS.md`](ARTICLE-COMPONENTS.md)；两套视觉系统不要混用。

---

## 内容 → 组件映射

| 内容类型 | 组件 |
|----------|------|
| 顶栏 / 页脚 | `.top`（`.sec`）、`.rule`、`.foot`（`.en`） |
| 标题页 | `.slide-title` → `h1` / `.subtitle` / `.meta` |
| 章节标题 | `.slide-content` → `h2` / `p.dek` |
| 内容区 | `.body` |
| 行列表 | `.rows` + `.row`（`.key` / `.nm` / `.ds`），紧凑版 `.rows.tight` |
| 段落 | `p` 或 `p.dek` |
| 代码示例 | `.code-block` + `.code-head`（`.code-dots` + `.code-label`）+ `pre code.language-xxx` |
| 数值数据 | `.stats-grid` + `.stat-card` |
| 数据对比 | `.version-table`（最佳行 `.best-row`） |
| 条形图 | `.bar-row` + `.bar-fill.classic\|branchless\|branchless2\|branchless3\|ipc` |
| 列举/分类 | `.cat-grid` + `.cat-item`（`.cat-name` + `.cat-desc`） |
| 关键结论 | `.highlight-box`（info / warn / success / danger） |
| 总结收尾 | `.summary-grid` + `.highlight-box.success` |
| 行内代码 | `span.inline-code` |
| 标签标记 | `span.tag` 或 `.tag.fast` / `.tag.slow` |
| 配图 | `.slide-image` + `p.image-caption` |

---

## 版面骨架（每页都必须长这样）

固定 960×540 画框，顶栏、页脚各占一条，内容区 `flex:1` 吃掉剩余高度。**页面高度必须正好 540px**，内容多了拆页，不许靠缩字号。

```html
<div class="slide slide-content" data-index="1">
    <div class="top">
        <span><span class="sec">01</span> · 简介</span>
        <span>产品名 · 模块</span>
    </div>
    <div class="rule"></div>

    <h2>页面标题</h2>
    <p class="dek">一句话说明这页在讲什么。</p>

    <div class="body">
        <!-- 组件放这里，从 dek 下方开始，向下填满 -->
    </div>

    <div class="foot">
        <span>这一页的结论句。</span>
        <span class="en">来源 / 关键词</span>
    </div>
</div>
```

- `.top` 左：`<span class="sec">编号</span> · 章节名`；右：deck 名或模块名。等宽大写小字
- `.rule` 顶栏下的一条 hairline，**不许省**
- `h2` 是页面主张，不写「概述」「背景」这种空词
- `.dek` 一到两句，给 h2 补上下文
- `.body` 从 `h2`/`.dek` 下方开始向下排，不垂直居中；内容不够就加内容，不要靠位移制造上下空白
- `.body` 的直接子元素 `.code-block` 会自动拉伸填满内容区，代码页因此不会留下半页空白
- `.foot` 左：本页结论（不是页码）；右：来源、模块名或英文关键词。**不许省**

---

## 标题页 (`.slide-title`)

```html
<div class="slide slide-title" data-index="0">
    <div class="top">
        <span>Rust · GNSS · 航天动力学</span>
        <span>sidereon · 2026</span>
    </div>
    <div class="rule"></div>
    <div class="cover-body">
        <h1>sidereon</h1>
        <p class="subtitle">卫星传播、过境预测、精确定位与坐标转换，一个 crate 覆盖全栈。</p>
        <div class="meta">
            <span>Neil Berkman</span>
            <span>v0.35.0</span>
            <span>GNSS · 定位 · RTK</span>
        </div>
    </div>
    <div class="foot">
        <span>一句话价值主张。</span>
        <span class="en">sidereon.dev</span>
    </div>
</div>
```

`h1` 3rem；`.subtitle` 一到两句；`.meta` 是等宽标签行（作者、版本、关键词），上方有 hairline。分类词放顶栏左侧，不要在标题上方再重复一次。

---

## 文字段落 (`p` / `.dek`)

```html
<p class="dek">梯度直方图提升算法中的一步：将浮点数均匀分配到 0–254 的整数桶中。</p>
<p>正文段落，不超过三句。</p>
```

`.dek` 紧跟 `h2`，用于导语；纯 `p` 用于 `.body` 内的正文。字号 0.72–0.75rem。

---

## 数值卡片 (`.stats-grid`)

```html
<div class="stats-grid">
    <div class="stat-card"><div class="stat-number">1,000,000</div><div class="stat-label">输入值</div></div>
    <div class="stat-card"><div class="stat-number blue">255</div><div class="stat-label">桶边界</div></div>
    <div class="stat-card"><div class="stat-number amber">0–254</div><div class="stat-label">目标整数</div></div>
</div>
```

顶部粗线 + 底部 hairline，卡片间竖线分隔。`.stat-number` 无修饰为墨色，变体 `.blue`（强调）、`.green`（好结果）、`.amber`（注意）、`.red`（坏结果）。一页最多给一个数字上色。

---

## 键值对列表 (`.cat-grid`)

```html
<div class="cat-grid">
    <div class="cat-item"><span class="cat-name">指令级并行</span><span class="cat-desc">CPU 自动并行独立指令。</span></div>
    <div class="cat-item"><span class="cat-name">分支预测器</span><span class="cat-desc">遇到分支时<strong>猜测</strong>路径提前执行。</span></div>
    <div class="cat-item"><span class="cat-name">寄存器重命名</span><span class="cat-desc">消除假依赖。</span></div>
    <div class="cat-item"><span class="cat-name">乱序执行</span><span class="cat-desc">在等待时提前做后面的工作。</span></div>
</div>
```

两列网格，每项顶部一条 hairline，纵向 padding 12px。名称 ≤ 8 字，描述 ≤ 24 字。4–6 项最好。

---

## 代码块 (`.code-block`)

```html
<div class="code-block">
    <div class="code-head">
        <span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="code-label">Rust · 二分查找</span>
    </div>
    <pre><code class="language-rust">let middle = min_idx + ((max_idx - min_idx) / 2);
if less_than(boundaries[middle], value) {
    min_idx = middle + 1;
}</code></pre>
</div>
```

- 外壳 `.code-block`：hairline 边框、浅底；`.code-head` 顶栏（三点装饰 + 右对齐语言标签）
- `code` 必须标语言：`language-rust`、`language-python`、`language-javascript`、`language-bash`、`language-text`
- `.code-label` 写「语言 · 用途」，全篇口径统一
- HTML 实体必须转义：`<` → `&lt;`，`>` → `&gt;`，`&` → `&amp;`，`"` → `&quot;`
- **无横向滚动**：`white-space: pre-wrap`，单行 ≤ 80 字符，超长主动换行
- **行号自动生成**：模板已集成 `highlightjs-line-numbers`，不手写行号
- **token 配色内置**，不引第三方主题 CSS
- 5–14 行。540px 画框里，代码页最多放一个代码块 + 一个 `.highlight-box`；再多就拆页

---

## 高亮框 (`.highlight-box`)

```html
<div class="highlight-box info">
    <strong>现有实现：</strong>编译语言 + 多核并行。瓶颈在<strong>CPU 内部的执行效率</strong>。
</div>
```

四种变体，只有左边线和底色变化：`.info`（蓝）、`.warn`（琥珀）、`.success`（绿）、`.danger`（红）。一页最多一个，放 `.body` 末尾。

---

## 数据表格 (`.version-table`)

```html
<table class="version-table">
    <tr><th>版本</th><th>耗时</th><th>指令</th><th>IPC</th></tr>
    <tr><td>classic</td><td>45,810 µs</td><td>184.9M</td><td>1.1</td></tr>
    <tr class="best-row"><td><strong>branchless</strong></td><td><strong>13,198 µs</strong></td><td>188.1M</td><td><strong>4.0</strong></td></tr>
</table>
```

表头等宽小字 + 粗线，最佳行 `.best-row`（浅底 + 首列强调色）。列数 ≤ 6，数字用千分位与单位。表格宽度自适应画框，不出现横向滚动，列多就删列。

---

## 条形图 (`.bar-row`)

标签在上、轨道占满整宽，左边缘与页面内容对齐：

```html
<div class="bar-row">
    <span class="bar-label">classic · 45,981 µs</span>
    <span class="bar-value">100%</span>
    <div class="bar-track"><div class="bar-fill classic" style="width:100%;">45,981</div></div>
</div>
<div class="bar-row">
    <span class="bar-label">branchless · 13,269 µs</span>
    <span class="bar-value">29%</span>
    <div class="bar-track"><div class="bar-fill branchless" style="width:29%;">13,269</div></div>
</div>
```

- `.bar-label` 第一列，`.bar-value` 第二列（可省），`.bar-track` 跨两列占满整宽
- `.bar-fill` 变体：`.classic`（墨黑）、`.branchless`（强调蓝）、`.branchless2`（灰蓝）、`.branchless3`（绿）、`.ipc`（琥珀）
- 一页最多 5 条；条内数字与 `.bar-value` 不要重复

---

## 总结网格 (`.summary-grid`)

```html
<div class="summary-grid">
    <div class="item"><h4>理解 CPU</h4><ul><li>分支预测失败代价巨大</li><li>IPC 是效率标尺</li></ul></div>
    <div class="item"><h4>优化策略</h4><ul><li>消除不可预测分支</li><li>减少重复计算</li></ul></div>
</div>
```

四宫格，每格一个 `h4` + 2–3 条 `li`，顶部粗线。用于总结页。

---

## 行内代码 (`.inline-code`)

```html
启用 <span class="inline-code">x86-64-v3</span> 目标
```

正文中的代码片段、函数名、字段名。每段正文最多 3 处。

---

## 标签 (`.tag`)

```html
<span class="tag fast">快</span>
<span class="tag slow">慢</span>
```

无修饰是灰底小标签；`.tag.fast`（绿描边）与 `.tag.slow`（红描边）用于状态标记。文字 ≤ 4 字。

---

## 配图 (`.slide-image`)

```html
<div>
    <p class="image-caption">图 1：微服务架构中的请求流转路径</p>
    <div class="slide-image"><img src="images/img-01.jpg" alt="架构示意图" /></div>
</div>
```

- `.slide-image` 提供 hairline 边框与居中；`img` 为 `max-width:100%`、`max-height:280px`、`object-fit:contain`，等比缩放不裁剪
- `p.image-caption` 用等宽小字，放在图**上方**（紧贴图）
- 图片路径用相对路径 `images/img-XX.ext`，与 HTML 同级
- 每页最多一张主图；图片高度会挤压 `.body`，代码与图同页时用并排

---

## 左右并排

代码块与配图同页、纵向排不下时使用：

```html
<div style="display:grid;grid-template-columns:60% 1fr;gap:18px;align-items:center;">
    <div class="code-block">…</div>
    <div>
        <p class="image-caption">图 1：说明文字</p>
        <div class="slide-image"><img src="images/img-01.png" alt="…" /></div>
    </div>
</div>
```

- 代码标签在 `.code-head` 里，不需要单独排标签行
- **禁止用 flex 并排**：flex 的 `align-items:center` 只居中整栏，栏内文字会把两个主块顶成顶部对齐
- `.code-block` 与 `.slide-image` 都写 `margin:0`，间距交给 `gap`
- 图片保持 `object-fit:contain`，不因栏窄而裁剪

**完成标准：** 浏览器测得左右两栏垂直中心 |Δ| ≤ 2px。

---

## 行内示意图（仅限需要时）

原文涉及数据变换或算法流程时，可用简易 `<div>` + `style` 属性展示，不新增全局 CSS：

```html
<div style="border:1px solid var(--rule);padding:9px 12px;
    font-family:var(--font-mono);font-size:0.64rem;
    color:var(--text-secondary);line-height:1.8;">
   values:    { 0x41, 0x42, 0x43, 0x0A, 0x44 }<br/>
   threshold: { 0x0F, 0x0F, 0x0F, 0x0F, 0x0F }
</div>
```

仅当原文有此内容、且示意图明显提升理解时才用。

---

## 导航栏 (固定在每一页底部)

```html
<div class="navigation-bar">
    <button class="nav-arrow" id="prevBtn">&#9664;</button>
    <div class="dot-indicators" id="dotIndicators"></div>
    <button class="nav-arrow" id="nextBtn">&#9654;</button>
</div>
```

完全固定，不许改动。

---

## CSS 变量（逐字复制，不许修改）

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
--font-mono: 'Noto Sans Mono CJK SC', 'SF Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', 'Consolas', monospace;
--bg-page: #e9e6de;
--bg-slide: #fdfdfb;
--ink: #111413;
--text-primary: #22272c;
--text-heading: #111413;
--text-secondary: #3c4441;
--text-muted: #6c7572;
--accent: #1f4bd8;
--accent-ink: #101b3b;
--rule: rgba(17, 20, 19, 0.14);
--rule-strong: rgba(17, 20, 19, 0.34);
--code-bg: #f7f6f2;
--code-border: rgba(17, 20, 19, 0.12);
--code-text: #22272c;
--tag-bg: #f1efea;
--tag-text: #5a6268;
--success: #2f7a4f;
--warn: #9a6b12;
--danger: #b03a2e;
--info: #1f5fa8;
--shadow: 0 1px 2px rgba(20, 23, 26, 0.05), 0 18px 44px rgba(20, 23, 26, 0.08);
--transition: 0.3s ease;
```

这套令牌 + 等宽标签 + hairline + 单一强调色构成代码模板的亮色视觉系统。**值一个字都不许改**；需要新颜色时用现有变量的透明度，不要新增色值。
