# 非代码文章模板组件参考

用于 [`article-template/index.html`](article-template/index.html)。适用于观点、叙事、案例、行业分析与数据图表类文章。

与 [`COMPONENTS.md`](COMPONENTS.md) 的区别：代码模板是固定词汇表；非代码模板只固定画框、顶栏、页脚、导航与字体系统，每页可以写自己的局部布局。页面之间允许版式变化，但字号、颜色、hairline、页脚结构必须统一。

---

## 文件结构

```text
<输出目录>/
├── index.html          # 复制 article-template/index.html 后整页替换
└── images/
    └── img-01.jpg      # 与 HTML 同级
```

单个自包含 HTML。CSS、JS、示例内容都在文件内，不引外部样式或脚本；`images/` 只放正文配图。模板自带 10 个示例页，覆盖封面、论点、行列表、图表、引语、收尾。

---

## 画框与共享原语

- 画框 960×540，`padding:35px 45px 29px`，内容区宽 870px
- 版心结构：`.top` + `.rule` + 标题区 + 主体 + `.foot`
- 顶栏与页脚各占一条 hairline，主体用 `flex:1` 吃掉剩余高度
- `.slide` 之外只放 `.navigation-bar`，不套 iframe、不写 manifest

| 类 / 变量 | 用途 |
|---|---|
| `.slide` | 960×540 画框，纵向 flex，`overflow:hidden` |
| `.top` / `.top .sec` | 顶栏，等宽大写小字；`.sec` 为序号强调色 |
| `.rule` | 顶栏下 hairline，每页必须有 |
| `.kicker` | 标题上方的栏目 / 眉题，等宽字 |
| `h2` / `h2.big` | 页面主张，33px / 44px |
| `.dek` | 标题下一到两句上下文，12px |
| `.foot` / `.foot .en` | 页脚，左侧结论，右侧来源 / 英文关键词 |
| `.note` / `.note b` | 图注、旁注、限定说明，9px |
| `.mono` | 行内专名、函数名、字段名 |
| `.muted` / `.signal` | 弱化文字 / 强调文字 |
| `.navigation-bar` | 底部导航，固定结构，不许改动 |

颜色令牌：`--bg-page` 页面底、`--bg-slide` 画框底、`--ink` 墨、`--text-muted` 灰、`--rule` hairline、`--signal` 信号橙、`--signal-text` 深橙（文字用）、`--soft` 正文灰。**全篇只用一个强调色**，需要层次时用墨色深浅与字号，不加第二色。

字号（960 视口，2x 截图约翻倍）：`h1` 48px、`h2` 33px、`h2.big` 44px、`.dek` 12px、正文 11–12px、`.foot` 10.5px、`.note` 9px、等宽标签 8–9.5px。正文不小于 11px。

---

## 页面骨架

```html
<div class="slide slide-content" id="p03" data-index="3">
  <div class="top">
    <span><span class="sec">03</span> · 章节名</span>
    <span>栏目 · 关键词</span>
  </div>
  <div class="rule"></div>

  <h2>这一页的主张，不写「概述」</h2>
  <p class="dek">一到两句，给标题补上下文。</p>

  <div class="body">
    <!-- 内容从 dek 下方开始，向下填满 -->
  </div>

  <div class="foot">
    <span>本页结论，一句说完。</span>
    <span class="en">SOURCE / KEYWORD</span>
  </div>
</div>
```

- `.top` 左：序号 + 章节；右：栏目、品牌或日期。两边都不能空
- `.rule` 每页必须有
- `.foot` 左：本页结论；右：来源、英文关键词或日期。两边都不能空
- 每页 `.slide` 的 `data-index` 从 0 连续，第 0 页加 `.slide-title`，其余 `.slide-content`
- 主体不许垂直居中悬空；内容不足就补数字、表格、引语或旁注

---

## 标题页

```html
<div class="slide slide-title" id="p01" data-index="0">
  <div class="top">
    <span>品牌 · 作者</span>
    <span>栏目 · 2026-10-19</span>
  </div>
  <div class="rule"></div>

  <div style="margin-top:37px;display:flex;align-items:flex-start;justify-content:space-between;">
    <div>
      <div class="kicker">栏目名</div>
      <h1 style="font-size:48px;line-height:1.16;letter-spacing:-.01em;margin-top:11px;font-weight:700;">
        主标题，<br>第二行可换行
      </h1>
      <p class="dek" style="width:420px;margin-top:15px;font-size:14.5px;">
        一句导语，说清这篇要回答什么。
      </p>
    </div>
    <span class="mark" style="width:48px;height:48px;display:block;">…</span>
  </div>

  <div class="foot">
    <span>作者 / 机构</span>
    <span class="en">2026-10-19</span>
  </div>
</div>
```

`h1` 48px。主标题写判断或冲突，不写「XX 概述」。logo 或标记必须有可核验来源，取不到就不放。

---

## 行列表

最稳的内容组件，天然填满内容区。每行一条 hairline。

```html
<div class="rows">
  <div class="row">
    <div class="key">A1</div>
    <div>
      <div class="nm">要点名称</div>
      <div class="ds">一句解释，不超过 40 字。</div>
    </div>
  </div>
</div>
```

```css
#p03 .row{ display:grid; grid-template-columns:36px 1fr; gap:14px; padding:10px 0; border-top:1px solid var(--rule); }
#p03 .row:last-child{ border-bottom:1px solid var(--rule); }
#p03 .key{ font-family:var(--font-mono); font-size:9px; letter-spacing:.12em; color:var(--signal-text); padding-top:2px; }
#p03 .nm{ font-size:14px; font-weight:700; line-height:1.3; }
#p03 .ds{ font-size:12px; line-height:1.6; color:#2e3532; margin-top:4px; }
```

4–5 行最好。行数少就把 `padding` 加到 13–15px，不要靠居中留白。

---

## 数字组

三到四个数字并排，用竖 hairline 分隔。数字用 `tabular-nums`。

```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);margin-top:19px;border-top:2px solid var(--ink);">
  <div style="padding:13px 15px 11px 0;border-right:1px solid var(--rule);">
    <div style="font-family:var(--font-mono);font-size:32px;line-height:1;font-variant-numeric:tabular-nums;">1,284</div>
    <div class="note" style="margin-top:6px;">说明这数字是什么</div>
  </div>
  <div style="padding:13px 15px;border-right:1px solid var(--rule);">
    <div style="font-family:var(--font-mono);font-size:32px;line-height:1;font-variant-numeric:tabular-nums;color:var(--signal-text);">29%</div>
    <div class="note" style="margin-top:6px;">一页最多一个数字上色</div>
  </div>
  <div style="padding:13px 0 11px 15px;">
    <div style="font-family:var(--font-mono);font-size:32px;line-height:1;font-variant-numeric:tabular-nums;">3.5×</div>
    <div class="note" style="margin-top:6px;">单位写清</div>
  </div>
</div>
```

---

## 引语页

用于幕间、论点、收尾。整页只放一段引语，不加第二个视觉主角。

```html
<div class="slide slide-content" id="p05" data-index="5" style="font-family:var(--font-serif);">
  <div class="top" style="letter-spacing:.3em;"><span>幕间</span><span>INTERLUDE</span></div>
  <div class="rule" style="background:var(--ink);"></div>

  <div style="flex:1;display:flex;align-items:center;gap:39px;">
    <div style="width:1px;align-self:stretch;background:var(--ink);margin:33px 0;"></div>
    <div style="flex:1;">
      <p style="font-size:32px;line-height:1.5;letter-spacing:-.01em;">原文引语，保留出处语言。</p>
      <p style="margin-top:23px;font-family:var(--font-sans);font-size:14px;line-height:1.85;color:#3a3833;max-width:505px;">中文翻译或解读。</p>
    </div>
    <aside class="note" style="width:150px;align-self:flex-end;padding-bottom:32px;">
      <b>出处</b>作者 · 标题 · 年份
    </aside>
  </div>

  <div class="foot"><span>一句承接。</span><span class="en">SOURCE</span></div>
</div>
```

引语必须真实可查。查不到就换成自己的判断，不要伪造名人名言。

---

## 图表（内联 SVG）

只在原文确有数据或趋势时画。文件路径与口径写在图注里。

```html
<svg viewBox="0 0 1240 250" style="display:block;width:620px;height:125px;overflow:visible;">
  <line x1="0" y1="215" x2="1240" y2="215" stroke="rgba(17,20,19,.22)"/>
  <line x1="0" y1="150" x2="1240" y2="150" stroke="rgba(17,20,19,.08)"/>
  <path d="M20 215 C 300 205, 700 170, 1230 54" fill="none" stroke="#111413" stroke-width="2.5"/>
  <circle cx="1230" cy="54" r="6" fill="#111413"/>
  <text x="1230" y="34" text-anchor="end" font-family="Noto Sans Mono CJK SC, monospace" font-size="17" fill="#111413">2026</text>
</svg>
```

- `viewBox` 用原始 2x 坐标，CSS 宽高按 960 画框写（通常是 620×125 或 870×165）
- 坐标轴、单位、口径必须有，或明确写「定性示意，非实测数值」
- 网格线用 `rgba(17,20,19,.08)`，轴用 `.22`，主线用 `--ink`
- 关键拐点用 `--signal` 画一个点或一条虚线，一页只标一个
- 不编造 y 轴数字；没有数据就画流程图或时间线，不画假折线

---

## 配图

```html
<figure style="margin:0;">
  <div class="note" style="margin-bottom:5px;">图 1：说明这张图证明了什么</div>
  <div style="border:1px solid var(--rule);padding:5px;background:#fff;">
    <img src="images/img-01.jpg" alt="架构示意图" style="display:block;max-width:100%;max-height:210px;object-fit:contain;margin:0 auto;">
  </div>
</figure>
```

- 与 HTML 同级：`images/img-XX.ext`
- `object-fit:contain`，绝不裁剪
- 图注在图上方，紧贴图片；图注写结论，不写「示意图」
- 每页最多一张主图，高度不超过 210px；再高就单独占一页

---

## 页面局部样式

模板里每页的 `<style>` 都用 `#pNN` 前缀限定作用域，例如 `#p03 .row { … }`。新增页面沿用这个规则：

```css
#p06 .wrap { display:grid; grid-template-columns:610px 1fr; gap:32px; flex:1; }
#p06 .row { padding:10px 0; border-top:1px solid var(--rule); }
```

- 所有页面局部选择器加 `#pNN` 前缀，不准写裸 `.row` / `.note`
- 不改 `:root`、`.slide`、`.top`、`.foot`、`.navigation-bar` 的基础数值
- 新布局只用 `grid` 或简单 `flex`，不新增第二个全局容器

---

## 导航

```html
<div class="navigation-bar">
  <button class="nav-arrow" id="prevBtn">&#9664;</button>
  <div class="dot-indicators" id="dotIndicators"></div>
  <button class="nav-arrow" id="nextBtn">&#9654;</button>
</div>
```

- 与 `coding-template.html` 同一套交互：prev / dot / next，方向键与空格翻页
- 导航圆点的类名是 `.nav-dot`，不要改回 `.dot`，避免和页面里的阶段圆点冲突
- 不设概览页、iframe、manifest

---

## 约束

1. 输出单个自包含 HTML，CSS 与 JS 全部内联
2. 每页 `.slide` 实测 960×540，`scrollWidth` / `scrollHeight` 不得超出
3. 每页 `.slide` 含 `data-index`，从 0 连续；第 0 页 `.slide-title`，其余 `.slide-content`
4. 每页 `.top` + `.rule` + `.foot` 齐全，左右两侧都有内容
5. 全篇单一强调色，每页强调不超过 3 处
6. 字号下限：正文 11px，标签 8px，`h2` 33px，`h1` 48px
7. 不写代码块；专名用 `.mono` 行内标注。代码是主角就改用代码模板
8. 不用内容投影、圆角卡片、渐变、logo 墙、emoji 堆砌；画框自身的阴影保留
9. 数字真实，图表有出处；没有数据就写「定性示意」
10. 一页一个视觉主角：行列表、数字组、图、引语，只选一个
11. 中文排印：中英文之间留空格，全角标点，不使用破折号（——）
12. 页面局部样式必须用 `#pNN` 作用域，避免串页
13. 图片放在 HTML 同级的 `images/`，路径用 `images/…`

---

## 验收

```bash
html-screenshot -o slides -r 1080 -p slide index.html
```

逐项检查：

- [ ] 每页截图输出成功，尺寸 1920×1080
- [ ] 页数与 `.slide` 数量一致，无空白页
- [ ] 每页 `.slide` 实测 960×540，无溢出
- [ ] 底部导航栏存在，prev / dot / next 均可用
- [ ] 页面局部样式未串页
- [ ] 每页顶栏、页脚两侧都有内容
- [ ] 没有代码块、圆角卡片、内容投影、渐变
- [ ] 所有图表都能追溯到原文数据，或明确标注定性示意
