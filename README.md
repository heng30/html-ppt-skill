# html-ppt-skill

文章 → HTML 幻灯片 → 讲解稿 → PNG 截图，一站式演示文稿生成工具链。

## 项目结构

```
html-ppt-skill/
├── html-ppt/                  # 幻灯片生成 Skill（双模板 + 组件文档 + 脚本 + 工作流）
│   ├── SKILL.md               # 主工作流：分析→选模板→分页→生成→验证→讲解稿→截图
│   ├── COMPONENTS.md          # 代码模板组件词汇表
│   ├── ARTICLE-COMPONENTS.md  # 非代码模板版式与组件参考
│   ├── coding-template.html   # 代码密集文章：单文件 960×540，底部导航栏
│   ├── article-template/      # 非代码文章：单文件 960×540，底部导航栏
│   │   └── index.html
│   └── scripts/               # 可执行脚本
│       ├── verify.js          # 版面验收：尺寸 / 溢出 / 组件 / 截图 / 讲解稿页码
│       ├── shot.js            # 逐页截图，1920×1080
│       ├── done.py            # 批量模式：从队列文件原子删除已完成 URL
│       └── batch.workflow.js  # 批量流水线（prux SubagentWorkflow）
└── html-screenshot/           # Rust 命令行工具：单文件 HTML 幻灯片逐页截图为 PNG
    ├── Cargo.toml
    ├── Makefile
    ├── src/main.rs
    └── index.html             # 示例幻灯片
```

## html-ppt（Skill）

一个 pi skill，将文章自动转化为精美的 HTML 幻灯片演示文稿。

### 模板选型

| 模板 | 适用文章 | 产出 |
|------|----------|------|
| `article-template/index.html` | 非代码文章：观点、叙事、案例、行业分析、数据图表 | 单个自包含 HTML（960×540），底部导航栏 |
| `coding-template.html` | 代码密集文章：大量代码例子、API、配置 | 单个自包含 HTML（960×540），底部导航栏 |

可展示代码 ≥ 3 段，或核心论点靠代码支撑，走代码模板；其余走非代码模板。

### 工作流

| 步骤 | 说明 | 完成标准 |
|------|------|----------|
| 1. 分析文章 | 提取标题、副标题、作者、日期、关键词；按内容类型划分章节 | 每章标注内容类型，无遗漏 |
| 2. 选模板与分页 | 非代码：8–14 页；代码：标题页 + 内容页 + 总结页 | 章节与页一一对应 |
| 3. 生成 HTML | 非代码：复制模板单文件，替换页面；代码：单文件套组件 | 对应文档的约束全部满足 |
| 4. 验证 | 画框尺寸、组件、路径、内容真实性 | 全部检查项通过 |
| 5. 讲解稿 | 为每页写口语化中文讲解词，保存为 `*-script.md` | 页数对应，全文连贯 |
| 6. 截图 | 两套模板都用 `scripts/shot.js`（或 `html-screenshot`） | `verify.js` 返回 `ok: true` |

### 输出结构

一篇 deck 一个目录：

```text
<slug>/
├── index.html      # 自包含幻灯片
├── script.md       # 逐页口播稿
├── slides/         # slide-1.png …
├── images/         # 正文配图（无图不建）
└── url             # 原文 URL
```

### 脚本

| 脚本 | 用途 | 命令 |
|------|------|------|
| `scripts/verify.js` | 验收：画框尺寸、溢出、顶栏页脚、data-index、代码块外壳、截图数、讲解稿页码 | `NODE_PATH=$(npm root -g) node html-ppt/scripts/verify.js <目录>` |
| `scripts/shot.js` | 逐页截图 1920×1080 | `NODE_PATH=$(npm root -g) node html-ppt/scripts/shot.js <目录>` |
| `scripts/done.py` | 从队列文件原子删除已完成 URL | `python3 html-ppt/scripts/done.py urls.txt <url>` |
| `scripts/batch.workflow.js` | 批量流水线（prux SubagentWorkflow） | 见 SKILL.md「批量模式」 |

`verify.js` 输出 `{ok, pages, errors, warns}`，退出码 0 才算通过；`--no-shots` 只验版面，`--min/--max` 改页数区间。

### 组件体系

代码模板的组件定义在 `COMPONENTS.md` 中，包括：

- **标题页** — `.slide-title`（pretitle / h1 / subtitle / meta）
- **内容页** — `.slide-content`（section-label / h2）
- **文字** — `p` / `p.desc`
- **数值卡片** — `.stats-grid` + `.stat-card`
- **键值对列表** — `.cat-grid` + `.cat-item`
- **代码块** — `pre code.language-xxx`（自动行号）
- **高亮框** — `.highlight-box`（info / warn / success / danger）
- **数据表格** — `.version-table`（支持 `.best-row` 最佳行高亮）
- **条形图** — `.bar-chart` + `.bar-fill`
- **总结网格** — `.summary-grid`
- **行内代码** — `span.inline-code`
- **标签** — `span.tag`（`.fast` / `.slow`）
- **导航栏** — `.navigation-bar`（固定结构，不许改动）

非代码模板的页面骨架、行列表、数字组、引语、图表、配图与局部样式写法见 `ARTICLE-COMPONENTS.md`。

### 约束

**代码模板**

1. CSS 变量块与模板逐字一致，不许修改
2. CSS 类名取自 COMPONENTS.md 词汇表
3. 导航栏 JS/HTML 从模板原样复制
4. 输出为单个自包含 HTML 文件
5. 外部资源仅限 Highlight.js CDN 及行号插件
6. 每页 `.slide` 含 `data-index`，从 0 连续递增
7. 行内视觉元素仅用 `style` 属性，不引入新 CSS 规则

**非代码模板**

1. 输出单个自包含 HTML，导航栏 HTML 与 JS 从模板原样复制
2. `:root` 与基础版式不改，页面差异用 `#pNN` 作用域的局部 `<style>`
3. 画框固定 960×540，内容溢出就拆页
4. 全篇单一强调色，不放代码块、内容投影、圆角卡片与渐变
5. 每页 `.slide` 含 `data-index`，从 0 连续

---

## html-screenshot（截图工具）

Rust 编写的命令行工具，基于 Chromium 将 HTML 幻灯片逐页截图为 PNG 图片。

### 安装

```bash
# 普通构建
make build

# 静态链接构建（Linux）
make build-static-linux

# 安装到 ~/.local/bin/
make install-linux
```

或直接使用 Cargo：

```bash
cargo build --release
```

### 用法

```bash
html-screenshot [选项] <HTML文件>
```

#### 参数

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--output` | `-o` | `.` | 输出目录 |
| `--resolution` | `-r` | `1080` | 分辨率等级（720/1080/1440/2160） |
| `--range` | `-n` | 全部 | 导出范围，如 `"1-3"` 或 `"2,5,7"` |
| `--prefix` | `-p` | 无 | 文件名前缀，输出为 `{prefix}-01.png` |
| `--invert` | | `false` | 反转亮度（暗色模式） |
| `--chrome-path` | | 自动检测 | Chromium/Chrome 可执行文件路径 |

#### 示例

```bash
# 导出全部幻灯片，1080p，前缀 slide
html-screenshot -o slides/ -r 1080 -p slide presentation.html

# 仅导出第 1-3 页和第 8 页
html-screenshot -n "1-3,8" -o output/ presentation.html

# 暗色模式输出
html-screenshot --invert -o dark-slides/ presentation.html

# 指定 Chrome 路径
html-screenshot --chrome-path /usr/bin/chromium presentation.html
```

#### 分辨率对照

| 等级 | 长边像素 | 适用场景 |
|------|----------|----------|
| 720 | 1280px | 预览 / 快速检查 |
| 1080 | 1920px | 标准演示（默认） |
| 1440 | 2560px | 高清屏幕 |
| 2160 | 3840px | 4K 输出 |

### 依赖

- **Rust** 2024 edition
- **Chromium / Chrome** — 自动检测常见路径，也可通过 `--chrome-path` 或 `CHROME_PATH` 环境变量指定
- **Cargo 依赖**：chromiumoxide、tokio、image、clap、base64、futures、serde_json

### 工作原理

1. 启动无头 Chromium，设置 1920×3840 大视口
2. 加载 HTML 文件，等待 Highlight.js 等资源就绪
3. 逐页激活 `.slide`，注入样式隐藏导航栏，测量幻灯片自然尺寸
4. 根据 `--resolution` 计算 `device_scale_factor`，截图时按比例缩放
5. 裁剪幻灯片区域，输出 PNG（可选反转亮度）
