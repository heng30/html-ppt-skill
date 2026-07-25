# html-ppt-skill

文章 → HTML 幻灯片 → 讲解稿 → PNG 截图，一站式演示文稿生成工具链。

## 项目结构

```
html-ppt-skill/
├── html-ppt/                  # 幻灯片生成 Skill（模板 + 组件词汇表 + 工作流）
│   ├── SKILL.md               # 主工作流：分析→分页→生成HTML→验证→讲解稿→截图
│   ├── COMPONENTS.md          # 组件词汇表：所有可用 HTML 组件及用法
│   └── light-template.html    # 亮色主题模板（CSS 变量 + 导航栏 JS）
└── html-screenshot/           # Rust 命令行工具：HTML 幻灯片逐页截图为 PNG
    ├── Cargo.toml
    ├── Makefile
    ├── src/main.rs
    └── index.html             # 示例幻灯片
```

## html-ppt（Skill）

一个 pi skill，将文章自动转化为精美的 HTML 幻灯片演示文稿。

### 工作流

| 步骤 | 说明 | 完成标准 |
|------|------|----------|
| 1. 分析文章 | 提取标题、副标题、作者、日期、关键词；按内容类型（prose/code/data/list/callout）划分章节 | 每章标注内容类型，无遗漏 |
| 2. 分页 | 第 0 页标题页，第 1…N-1 页内容页（一章一页），第 N 页总结页 | 章节与页一一对应 |
| 3. 生成 HTML | 从模板复制 CSS/JS，按 COMPONENTS.md 选用组件，输出单文件 HTML | 类名出自词汇表，CSS 变量与模板一致 |
| 4. 验证 | 标签闭合、data-index 连续、语言标注、导航栏完整等 | 全部检查项通过 |
| 5. 讲解稿 | 为每页写口语化中文讲解词，保存为 `*-script.md` | 页数对应，全文连贯 |
| 6. 截图 | 调用 html-screenshot 逐页输出 PNG | 图片清晰可读 |

### 组件体系

所有幻灯片组件定义在 `COMPONENTS.md` 中，包括：

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

### 约束

1. CSS 变量块与模板逐字一致，不许修改
2. CSS 类名取自 COMPONENTS.md 词汇表
3. 导航栏 JS/HTML 从模板原样复制
4. 输出为单个自包含 HTML 文件
5. 外部资源仅限 Highlight.js CDN 及行号插件
6. 每页 `.slide` 含 `data-index`，从 0 连续递增
7. 行内视觉元素仅用 `style` 属性，不引入新 CSS 规则

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
