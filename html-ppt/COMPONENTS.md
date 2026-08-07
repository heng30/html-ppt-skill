# 组件词汇表

html-ppt 的组件参考，每个组件有固定的 HTML 结构。

---

## 内容 → 组件映射

第一步标注的内容类型照此表选用组件：

| 内容类型 | 组件 |
|----------|------|
| 标题/元信息 | `.slide-title` → `.pretitle` / `h1` / `.subtitle` / `.meta` |
| 段落 | `p` 或 `p.desc` |
| 代码示例 | `.code-label` + `pre code.language-xxx` |
| 数值数据 | `.stats-grid` + `.stat-card` |
| 数据对比 | `.version-table-wrap` + `.version-table`（最佳行 `.best-row`） |
| 条形图 | `.bar-chart` + `.bar-fill.classic\|branchless\|branchless2\|branchless3\|ipc` |
| 列举/分类 | `.cat-grid` + `.cat-item`（`.cat-name` + `.cat-desc`） |
| 关键结论 | `.highlight-box`（info / warn / success / danger） |
| 总结收尾 | `.summary-grid` + `.highlight-box.success` |
| 行内代码 | `span.inline-code` |
| 标签标记 | `span.tag` 或 `.tag.fast` / `.tag.slow` |
| 配图 | `.slide-image` + `p.image-caption` |

---

## 标题页 (`.slide-title`)

```html
<div class="slide slide-title" data-index="0">
    <div class="pretitle">性能优化 · CPU架构 · Rust</div>
    <h1>6倍更快的<br />二分搜索</h1>
    <p class="subtitle">从编译代码到机械共鸣——如何让CPU不再与你为敌</p>
    <div class="meta">
        <span>🦀 Itamar Turner-Trauring</span>
        <span>📅 2026年7月11日</span>
        <span>⚡ 分支预测 · SIMD · IPC</span>
        <span>🔬 scikit-learn 实战</span>
    </div>
</div>
```

说明：`h1` 可内含 `<br />` 换行。`.meta` 里的每个 `span` 是一个标签。`.pretitle` 是分类/副标签。`.subtitle` 是副标题行。

---

## 内容页框架 (`.slide-content`)

```html
<div class="slide slide-content" data-index="1">
    <span class="section-label">背景</span>
    <h2>scikit-learn 中的浮点数分桶</h2>
    <!-- 各种内容组件按需组合 -->
</div>
```

每种内容页都用这个外层框架。`.section-label` 是章节标记——**短词**（≤ 8 字符），如"背景""优化#1""对比"。可用 emoji 前缀点缀（如 `📖 背景`）。`h2` 是页面标题，也建议用 emoji 前缀。

---

## 文字段落 (`p` / `.desc`)

```html
<p class="desc">梯度直方图提升算法中的一步：将浮点数均匀分配到 0–254 的整数桶中。</p>
<p>普通段落的样式。</p>
```

`.desc` 用于引导性和说明性段落（字号略小）。纯 `p` 用于普通文字。

---

## 数值卡片 (`.stats-grid`)

```html
<div class="stats-grid">
    <div class="stat-card"><div class="stat-number">1,000,000</div><div class="stat-label">输入值</div></div>
    <div class="stat-card"><div class="stat-number blue">255</div><div class="stat-label">桶边界</div></div>
    <div class="stat-card"><div class="stat-number amber">0–254</div><div class="stat-label">目标整数</div></div>
    <div class="stat-card"><div class="stat-number">二分搜索</div><div class="stat-label">算法</div></div>
</div>
```

`.stat-number` 的颜色变体：无修饰（默认色）、`.blue`、`.green`、`.amber`、`.red`。根据语义选择（好数据用 green，警告用 amber/red）。

---

## 键值对列表 (`.cat-grid`)

```html
<div class="cat-grid">
    <div class="cat-item"><span class="cat-name">⚡ 指令级并行</span><span class="cat-desc">CPU 自动并行独立指令。</span></div>
    <div class="cat-item"><span class="cat-name">🔀 分支预测器</span><span class="cat-desc">遇到分支时<strong>猜测</strong>路径提前执行。</span></div>
</div>
```

用于列举定义-描述对。`.cat-grid` 自动以两列网格排列。

---

## 代码块 (`pre code`)

```html
<span class="code-label">Rust 代码</span>
<pre><code class="language-rust">let middle = min_idx + ((max_idx - min_idx) / 2);
if less_than(boundaries[middle], value) {
    min_idx = middle + 1;
}</code></pre>
```

- `code` 上必须标注语言，class 格式为 `language-xxx`（Rust、python、javascript、bash、zig、c、text 等）
- `.code-label` 可选，显示"代码语言 + 说明"
- HTML 实体必须转义：`<` → `&lt;`，`>` → `&gt;`，`&` → `&amp;`，`"` → `&quot;`
- **代码块无横向滚动**：长行通过换行（`white-space: pre-wrap`）展示，不出现滚动条
- **行号自动生成**：模板内置 `highlightjs-line-numbers`，无需额外操作，行号自动出现在每行左侧

---

## 高亮框 (`.highlight-box`)

```html
<div class="highlight-box info" style="font-size:0.8rem;">
    <strong>🔍 现有实现：</strong>编译语言 + 多核并行。但还能更快吗？瓶颈在于<strong>CPU 内部的执行效率</strong>。
</div>
```

四种变体：
- `.highlight-box.info` —— 蓝色左边框，用于补充信息
- `.highlight-box.warn` —— 橙色左边框，用于问题警告
- `.highlight-box.success` —— 绿色左边框，用于正面成果
- `.highlight-box.danger` —— 红色左边框，用于严重问题

`style="font-size:0.8rem;"` 是可选控制，当内容较多时可加。

---

## 数据表格 (`.version-table`)

```html
<div class="version-table-wrap">
    <table class="version-table">
        <tr><th>版本</th><th>耗时</th><th>指令</th><th>分支</th><th>误预测</th><th>IPC</th></tr>
        <tr><td>classic</td><td>45,810 µs</td><td>184.9M</td><td>27.0M</td><td>16.6%</td><td>1.1</td></tr>
        <tr class="best-row"><td><strong>branchless</strong></td><td><strong>13,198 µs</strong></td><td>188.1M</td><td>19.0M</td><td><strong>0.0%</strong></td><td><strong>4.0</strong></td></tr>
    </table>
</div>
```

- 表格标题用 `th`
- 最佳行加 `tr.best-row`，最佳值用 `<strong>` 包裹（显示为加粗）
- 表格外层用 `.version-table-wrap` 包裹（提供横向滚动）

---

## 条形图 (`.bar-chart`)

```html
<div class="bar-chart">
    <div class="bar-row"><span class="bar-label">classic</span><div class="bar-track"><div class="bar-fill classic" style="width:100%;">45,981</div></div></div>
    <div class="bar-row"><span class="bar-label">branchless</span><div class="bar-track"><div class="bar-fill branchless" style="width:29%;">13,269</div></div></div>
</div>
```

`.bar-fill` 的颜色变体：`.classic`（红）、`.branchless`（金）、`.branchless2`（蓝）、`.branchless3`（绿）、`.ipc`（紫）。`style="width:XX%;"` 控制条的长度；条内文字显示数值。

---

## 总结网格 (`.summary-grid`)

```html
<div class="summary-grid">
    <div class="item">
        <h4>🧠 理解 CPU</h4>
        <ul>
            <li>分支预测失败代价巨大</li>
            <li>IPC 是效率标尺</li>
        </ul>
    </div>
    <div class="item">
        <h4>🔧 优化策略</h4>
        <ul>
            <li>消除不可预测分支</li>
            <li>减少重复计算</li>
        </ul>
    </div>
</div>
```

每个 `.item` 包含一个 `h4` 标题和一个 `ul` 列表。用于总结页，组织核心要点。

---

## 行内代码 (`.inline-code`)

```html
启用 <span class="inline-code">x86-64-v3</span> 目标
```

用于正文中出现的代码片段或技术名词。

---

## 行内示意图（仅限需要时）

当原文涉及数据变换或算法流程时，可用简易 `<div>` + `style` 属性展示，不用加到全局 CSS：

```html
<div style="background:#f9f7f3;border:1px solid var(--divider);
    border-radius:6px;padding:12px 16px;margin:8px 0;
    font-family:monospace;font-size:0.7rem;
    color:var(--text-secondary);line-height:1.8;">
   📥 values:    { 0x41, 0x42, 0x43, 0x0A, 0x44, 0x45, 0x46, 0x47 }<br/>
   📏 threshold: { 0x0F, 0x0F, 0x0F, 0x0F, 0x0F, 0x0F, 0x0F, 0x0F }
</div>
```

仅在原文有此内容、且图文并茂显著提升理解时才用。不引入新的 CSS 规则。

## 标签 (`.tag`)

```html
<span class="tag fast">快</span>
<span class="tag slow">慢</span>
```

`.tag` 无修饰为默认色。`.tag.fast`（绿色背景）和 `.tag.slow`（红色背景）用于状态标记。

---

## 配图 (`.slide-image`)

```html
<div class="slide-image">
    <img src="images/img-01.jpg" alt="架构示意图" />
</div>
<p class="image-caption">图 1：微服务架构中的请求流转路径</p>
```

- `.slide-image` 包裹 `<img>`，提供圆角、阴影和居中样式
- `img` 设置 `max-width:100%`、`max-height:360px`、`object-fit:contain`，等比缩放不裁剪，保证图片完整可见且不撑破布局
- `p.image-caption` 用于图片说明文字，取自原文图注或 alt 文本
- 图片路径使用相对路径 `images/img-XX.ext`，HTML 文件与 `images/` 目录同级
- 每页最多一张主图，与文字上下排列

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

## CSS 变量（不许修改）

```css
--bg-page: #f8f6f3;
--bg-slide: #ffffff;
--text-primary: #2c2c2c;
--text-heading: #1f3a3f;
--text-secondary: #5a5a5a;
--text-muted: #8c8c8c;
--accent: #c44f2c;
--accent-soft: #d9704a;
--accent-blue: #2c6280;
--code-bg: #f4f1ec;
--code-border: #cfc9bf;
--code-text: #2c2c2c;
--tag-bg: #ece6db;
--tag-text: #6b5f4e;
--divider: #e2ddd4;
--shadow: 0 2px 18px rgba(0, 0, 0, 0.06);
--shadow-hover: 0 4px 26px rgba(0, 0, 0, 0.09);
--transition: 0.3s ease;
```

这些变量构成了 html-ppt 的视觉品牌。**一个字都不许改。**
