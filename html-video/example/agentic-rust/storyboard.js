// Agent 对 Rust 意味着什么 · 分镜编排
// cue / until = SRT 序号（1-based，含两端）。所有时间由此推出，不写秒数。
// 静态语言取自 data/slides：纸白底、单一信号橙、发丝线、等宽小标、超大黑体标题。

module.exports = {
  META: {
    tail: 0.3
  },

  SCENES: [
    {
      cue: 1, until: 4, type: 'cover',
      section: '00', kicker: '语言设计 / AGENTIC DEV', hud: 'REBASE / SPLASH · 2026',
      title: ['Agent 对 Rust', '意味着什么，', '以及反向的作用'],
      sub: '如果 Agent 开始大规模写代码，编程语言设计这件事还有没有价值？Niko 的问题意识很直接，答案也不是安慰话。',
      sideTitle: '论证路线',
      side: [
        { i: '01', t: '现状 · 数字与三根支柱', cue: 1 },
        { i: '02', t: '护栏 · 测试、类型、证明', cue: 1 },
        { i: '03', t: '设计 · 真正的开放难题', cue: 1 }
      ],
      meta: [
        ['讲者', 'Niko Matsakis'],
        ['场合', 'REBASE / SPLASH'],
        ['时间', '2026 年 10 月']
      ],
    },
    {
      cue: 5, until: 10, type: 'statement',
      section: '01', kicker: '问题 / THE QUESTION',
      title: ['如果 Agent 能写代码，', '语言设计还有意义吗？'],
      title1: ['如果 Agent 能写代码，', '语言设计还有意义吗？'], title2: ['Rust 是舒服的选择，', '但还能更好'],
      lede: '这个问题不是网上随便吵出来的，是 Niko Matsakis 在 REBASE 演讲里正面回答的。',
      keys: [
        { i: '结论一', t: '人类还有位置', d: '不是安慰话：人类的价值正从写代码挪到理解代码。', cue: 7 },
        { i: '结论二', t: '语言设计仍然相关', d: '语言是给 Agent 的护栏，设计者的工作没有消失。', cue: 8 },
        { i: '结论三', t: 'Rust 是最舒服的选择之一', d: '但它还能更好，这正是后半场的题目。', cue: 9 }
      ],
    },
    {
      cue: 11, until: 13, type: 'flow',
      section: '01', kicker: '判断标准 / ROADMAP',
      title: ['先看现状，再看护栏，', '最后看设计'],
      nodes: [
        { i: '01', t: '现状', d: '数字与三根支柱', cue: 11 },
        { i: '02', t: '护栏', d: '测试、类型、证明', cue: 12 },
        { i: '03', t: '设计', d: '真正的开放难题', cue: 13, hot: true }
      ],
      note: '听完这一趟，你会拿到一套判断标准。',
      noteR: '哪些工作正在贬值，哪些反而更值钱',
    },

    {
      cue: 14, until: 18, type: 'stats',
      section: '02', kicker: '开场 / OPENING',
      title: ['五十年前的一台机器'],
      lede: 'Niko 五年级开始写程序。你算算这是什么量级，比今天一张照片还小。',
      stats: [
        { n: '5 MHz', u: 'x86 处理器的主频', cue: 15 },
        { n: '5 MB', u: '整块硬盘的容量', cue: 16 },
        { n: '512 KB', u: '全部内存', cue: 17 }
      ],
    },
    {
      cue: 19, until: 22, type: 'image',
      section: '02', kicker: '转折 / THE FLIP',
      title: ['五十年没变的动作，', '这几年突然翻面'],
      big: '「把代码敲进文件」这个动作，几十年没变过。连编辑器可能都还是 vi。',
      p: '变化发生在最近几年，一切突然翻面。硬件翻了几万倍，工具链换了无数轮，只有这个动作顽固地留在原地。',
      img: 'img-01.gif',
      cap: '抱着纸袋呼吸 · 冷静评估',
    },
    {
      cue: 23, until: 26, type: 'quote',
      section: '02', kicker: '心里那句话 / THE FEAR',
      quote: ['我的编程技能', '还有用吗？'],
      cite: 'Niko 在心里问的那句话，你大概也问过。',
      note: {
        t: '恐惧不是错觉',
        p: '他不是在否认冲击，而是在给冲击划一条边界：哪些技能真的贬值，哪些反而更值钱。'
      },
    },
    {
      cue: 27, until: 28, type: 'statement',
      section: '02', kicker: '分工变化 / DIVISION',
      title: ['人类的价值，', '正从写代码挪到理解代码'],
      keys: [
        { i: '过去', t: '把代码敲进文件', d: '核心技能是表达，把意图翻译成机器能跑的字符。', cue: 27 },
        { i: '现在', t: '理解代码与设计', d: '代码由 Agent 产出，人负责判断它是否真的做了该做的事。', cue: 28 }
      ],
    },

    {
      cue: 29, until: 33, type: 'stats',
      section: '03', kicker: '数据 / NUMBERS',
      title: ['Rust 的增长，', '是 Agent 选了它'],
      lede: 'David Tolnay 的观察里，最值得记的是增速；最能说明问题的是 Meta 的案例。',
      stats: [
        { count: 1200, suffix: '%', u: 'TypeScript 的年增长，领跑所有语言', bar: 100, cue: 30 },
        { n: '12 倍', u: '增速换算过来，跑在最前面', bar: 100, cue: 32 },
        { n: '第 2 名', u: 'Rust 的增速，紧随其后', bar: 74, cue: 33 }
      ],
    },
    {
      cue: 34, until: 36, type: 'statement',
      section: '03', kicker: 'Meta 案例 / META',
      title: ['Meta 工程师今年写的 Rust，', '等于过去九年总和的两倍'],
      lede: '最能说明问题的不是排名，是一家公司内部真实发生的变化。',
      keys: [
        { i: '9 年', t: '过去九年的全部积累', d: '这是分母。', cue: 34 },
        { i: '1 年', t: '今年一年写出的第一方 Rust', d: '这是分子。', cue: 35 },
        { i: '2 倍', t: '一年等于九年总和的两倍', d: '这已经不是自然增长。', cue: 36 }
      ],
    },
    {
      cue: 37, until: 38, type: 'quote',
      section: '03', kicker: '梗图 / THE JOKE',
      quote: ['“I wrote this in Rust.”', '“Be honest.”'],
      quoteAt: [37, 38],
      cite: '我用 Rust 写的。诚实点，是 Agent 写的，谢谢。',
      note: {
        t: '代码署你的名字，作者另有其人',
        p: '这不是段子，是语言选择成本归零之后，最真实的交付现场。'
      },
    },

    {
      cue: 39, until: 49, type: 'list',
      section: '04', kicker: '为什么是 Rust / WHY RUST',
      title: ['不是语言之争，', '是成本结构变了'],
      title1: ['试错成本归零，', '人选跑得快的'], title2: ['Rust 本身契合 Agent，', 'Go 另有甜点区'],
      lede: 'Niko 给了三层理由，最后还留了一块余地。',
      rows: [
        { k: 'C1', t: '试错成本，几乎归零', d: '以前换语言要先学会它，现在 Agent 替你承担了学习曲线，试错变得很便宜。', cue: 41 },
        { k: 'C2', t: '随便选都行的时候，大家选跑得快的', d: '语言偏好退场之后，性能成了最直接的比较维度，Rust 自然被推到前面。', cue: 43 },
        { k: 'C3', t: '最根本的一点：Rust 本身契合 agentic 编码', d: '不是 Rust 赢了辩论，是它的约束刚好适合 Agent 工作。', cue: 45 },
        { k: 'C4', t: '他也留了余地：Go 同样合适', d: '只是落在另一个甜点区，代价是数据竞争和隐蔽 bug 更容易溜过去。', cue: 47 }
      ],
    },
    {
      cue: 50, until: 52, type: 'statement',
      section: '05', kicker: '三根支柱 / PILLARS',
      title: ['别把 Agent 当成一个整体，', '拆成三件事看'],
      lede: '要把 Agent 真拿来做基础软件，Niko 的第一句话就是拆。',
      keys: [
        { i: '不要', t: '整体评估', d: '整体会掩盖三件事之间巨大的进度差异。', cue: 51 },
        { i: '而是', t: '拆成三根支柱', d: '设计、构建、优化，各自有各自的瓶颈。', cue: 52 }
      ],
    },
    {
      cue: 53, until: 59, type: 'pillars',
      section: '05', kicker: '三根支柱 / PILLARS',
      title: ['造软件拆成三件事，', '进度极不均衡'],
      lede: '没有一件被真正解决。',
      pillars: [
        { h: 'Design · 设计', t: '想清楚，并且明确规格化', d: '这段代码到底该做什么。当前最先进的做法，基本还停在「写 Markdown，然后指望 Agent 认真读」。', l: '现状：文档 + 提示词', r: '进展最慢', bar: 18, cue: 53 },
        { h: 'Build · 构建', t: '写出确实做了该做的事的代码', d: '可靠性次之：类型系统已经提供了一部分现成的护栏，但护栏之外还有大片空白。', l: '现状：类型检查 + 测试', r: '有现成护栏', bar: 52, cue: 56 },
        { h: 'Optimize · 优化', t: '把代码调到高效运行', d: '进展最快，因为性能有明确的客观信号可用：跑一次 benchmark，好坏立刻分晓。', l: '现状：benchmark + profiler', r: '信号最清楚', bar: 88, cue: 58, hot: true }
      ],
    },
    {
      cue: 60, until: 70, type: 'statement',
      section: '05', kicker: '进度差 / THE GAP',
      title: ['只有优化，', '手里有一把客观的尺子'],
      title1: ['三件事，', '一件都没被真正解决'], title2: ['只有优化，', '手里有一把客观的尺子'],
      lede: '优化跑得最快，可靠性次之，设计基本还停在写 Markdown，然后指望 Agent 认真读。',
      keys: [
        { i: '01 优化', t: 'benchmark 直接告诉你好坏', d: '跑一次就有结论，信号最清楚。', cue: 63 },
        { i: '02 可靠性', t: '类型系统已经能给一部分护栏', d: '护栏之外还有大片空白。', cue: 65 },
        { i: '03 设计', t: '还停在写 Markdown', d: '然后指望 Agent 认真读。', cue: 67 }
      ],
    },

    {
      cue: 71, until: 73, type: 'statement',
      section: '06', kicker: '性能 / PERF',
      title: ['既然优化跑得最快，', 'Rust 在这里做对了什么？'],
      lede: '两句话。',
      keys: [
        { i: '第一句', t: '默认性能就好', d: '惯用的写法通常也是最快的写法。', cue: 73 },
        { i: '第二句', t: '旋钮全都留着', d: '需要极限时，每一处都还能再拧。', cue: 73 }
      ],
    },
    {
      cue: 74, until: 79, type: 'list',
      section: '06', kicker: '性能哲学 / PERF',
      title: ['默认就快，', '还能一处处拧'],
      title1: ['第一句：', '默认性能就好'], title2: ['过去这些旋钮', '近乎玄学'],
      rows: [
        { k: 'P1', t: '默认性能就好', d: '惯用的写法通常也是最快的写法，不写优化也能拿到不错的代码，这是 Rust 性能哲学的第一句。', cue: 74 },
        { k: 'P2', t: '旋钮全都留着', d: '栈还是堆、指针间接在哪、结构体布局怎么排、async 帧在哪装箱，极限情况还能写内联汇编。', cue: 76 },
        { k: 'P3', t: '过去这些旋钮近乎玄学', d: '得熬很多年才敢碰。Agent 改变了谁能碰它们。', cue: 78 }
      ],
    },
    {
      cue: 80, until: 87, type: 'flow',
      section: '06', kicker: '会复利的回路 / THE LOOP',
      title: ['调优从玄学，', '变成一条会复利的回路'],
      title1: ['过去靠经验，', '现在靠信号'], title2: ['调优变成一条', '会复利的回路'],
      nodes: [
        { i: '01', t: '代码', d: '先跑起来', cue: 80 },
        { i: '02', t: 'benchmark', d: '给出好坏', cue: 84 },
        { i: '03', t: 'profile', d: '指出热点', cue: 84 },
        { i: '04', t: 'Agent 分析', d: '读懂信号', cue: 85, hot: true },
        { i: '05', t: '提出 PR', d: '动手去调', cue: 85 },
        { i: '06', t: '代码变快', d: '回到 benchmark', cue: 86 }
      ],
      loop: '↺ 这条回路一旦转起来，会复利',
      note: '密码学圈子过去靠人手工调汇编，现在交给 Agent。',
      noteR: '网络服务用 dial9 查 long poll、阻塞这些坑',
    },
    {
      cue: 88, until: 95, type: 'split',
      section: '06', kicker: '手感 / THE FEEL',
      title: ['性能把人吸引过来，', '真正让人留下的是手感'],
      cols: [
        {
          h: 'Greg Brockman · 2026-01', big: 'Rust 是完美的 Agent 语言',
          p: ['因为只要它能编译，就约等于正确。'], cue: 90
        },
        {
          h: '同一种手感，不止 Rust', alt: true,
          p: ['OCaml 和 Haskell 也有同一种「编译即正确」的手感，Agent 恰好最能从中获益。'],
          tag: '护栏够强，Agent 才有稳定的落脚点。', cue: 93
        }
      ],
    },
    {
      cue: 96, until: 99, type: 'quote',
      section: '06', kicker: '伏笔 / THE CATCH',
      quote: ['能编译就正确，', '只是一道很强的护栏，', '它不是正确性证明。'],
      quoteAt: [97, 98, 98],
      cite: '这两者的差别，就是后面半场的全部内容。',
      note: {
        t: '护栏够不够用？',
        p: '什么时候必须上证明？我们一个一个看。'
      },
    },
    {
      cue: 100, until: 102, type: 'statement',
      section: '06', kicker: '两个问题 / TWO QUESTIONS',
      title: ['护栏够不够用？', '什么时候必须上证明？'],
      keys: [
        { i: '问题一', t: '测试能兜住多少？', d: '跑通、覆盖、看起来符合预期，够不够？', cue: 100 },
        { i: '问题二', t: '证明什么时候上场？', d: '哪些性质必须被证明，而不只是被测试？', cue: 101 }
      ],
    },

    {
      cue: 103, until: 106, type: 'quote',
      section: '07', kicker: '测试 / TESTS',
      quote: ['测试能显示缺陷的存在，', '但不能显示缺陷的不存在。'],
      quoteAt: [103, 104],
      cite: 'Dijkstra · 1970',
      note: {
        t: '这句话放到今天更成立',
        p: '有了 Agent 之后，差得不是一星半点。'
      },
    },
    {
      cue: 107, until: 114, type: 'list',
      section: '07', kicker: '交付现场 / THE SCENE',
      title: ['头几个测试都挺好，', '再写一个就发疯'],
      title1: ['头几个测试都挺好'], title2: ['挖下去才发现'],
      rows: [
        { k: 'T1', t: '头几个测试都挺好', d: '跑通、覆盖、看起来都符合预期，于是你开始信任这段代码。', cue: 108 },
        { k: 'T2', t: '再写一个，直接发疯', d: '疯到你根本想象不出这个 bug 是怎么来的，复现路径看着毫无道理。', cue: 110 },
        { k: 'T3', t: '挖下去才发现', d: 'Agent 完全跑偏了你试图表达的逻辑。', cue: 112 }
      ],
    },
    {
      cue: 115, until: 116, type: 'image',
      section: '07', kicker: '证据 / NAILED IT',
      title: ['歪蛋糕，', '配一句 Nailed it'],
      big: '这就是 Agent 给你交付成果的样子。',
      p: '测试绿了，形状仍然歪。它不是没做事，它是没做对你想让它做的事。',
      img: 'img-03.gif',
      cap: 'Nailed it · 交付现场',
    },
    {
      cue: 117, until: 123, type: 'list',
      section: '07', kicker: '护栏 / GUARDRAIL',
      title: ['那护栏从哪来？', '从类型系统来'],
      rows: [
        { k: 'T4', t: '尤其是 Rust 这种进阶类型系统', d: '它不只查字段名对不对。', cue: 117 },
        { k: 'T5', t: '还能给出资源安全保证', d: '保证你再也不用关 socket，把一整类错误挡在编译期。', cue: 121 },
        { k: 'T6', t: '把生命周期错误从可能变成不可能', d: '这不是更勤快的测试，是换了一种保证方式。', cue: 123 }
      ],
    },
    {
      cue: 124, until: 126, type: 'quote',
      section: '08', kicker: '类型 / TYPES',
      quote: ['类型系统能显示缺陷的不存在，', '但不能显示正确性的存在。'],
      quoteAt: [125, 126],
      cite: 'Niko 照着 Dijkstra 造了一句',
      note: {
        t: '它只是一组简单规则',
        p: '你遵守它，就避开了某几类错误。'
      },
    },
    {
      cue: 127, until: 131, type: 'split',
      section: '08', kicker: '边界 / THE LIMIT',
      title: ['它保证你没做错某些事，', '但不保证你做对了事'],
      cols: [
        { h: '类型系统能给你', big: '避免做错', p: ['一组简单规则，遵守它就避开某几类错误。'], li: ['字段名对不对', '资源有没有被释放', '生命周期是否越界'], cue: 128 },
        { h: '类型系统给不了', big: '做对了事', alt: true, p: ['它不证明算出来的结果，正是你想要的结果。'], tag: '想再往前一步，就得上证明系统。', cue: 130 }
      ],
    },
    {
      cue: 132, until: 138, type: 'list',
      section: '08', kicker: '证明工具 / PROOF TOOLS',
      title: ['Rust 生态里，', '已经有一批证明工具'],
      title1: ['借用检查与演绎验证'], title2: ['翻译进证明助手，与模型检查'],
      rows: [
        { k: '01', t: 'Verus', d: '借助借用检查器来简化 SMT 求解，让求解器少处理一大块约束。', tag: '借用检查 / SMT', cue: 135 },
        { k: '02', t: 'Creusot', d: '走演绎验证的路线，把 Rust 代码生成成 Why3 目标。', tag: '演绎验证 / WHY3', cue: 136 },
        { k: '03', t: 'Aeneas', d: '把 Rust 翻译进证明助手，在证明助手里完成剩下的推理。', tag: '翻译 / 证明助手', cue: 137 },
        { k: '04', t: 'Kani', d: '用模型检查覆盖 panic 自由这类性质，不需要人手写证明脚本。', tag: '模型检查 / PANIC-FREE', cue: 138 }
      ],
    },
    {
      cue: 139, until: 142, type: 'steps',
      section: '08', kicker: '落地路径 / THE PATH',
      title: ['落地路径并不玄'],
      steps: [
        { i: '第一步', t: '先证明代码 PANIC-FREE', d: '消掉一大批 bug。虽然本质上还是「避免做错」的类型检查式性质，但门槛低、收益大。', cue: 139 },
        { i: '第二步', t: '再往上加断言', d: '证明代码算出来的正是你想要的结果，这时候才真正触到「正确」。', cue: 142 }
      ],
    },

    {
      cue: 143, until: 147, type: 'statement',
      section: '09', kicker: '证明 / PROOF',
      title: ['证明不只为了写对，', '也为了写快'],
      lede: '这一页最反直觉。凭什么？因为密码学算法的数学定义极清晰。',
      keys: [
        { i: '前提', t: '数学定义极清晰', d: '成功标准可以被完全规格化。', cue: 145 },
        { i: '指令', t: '随便你怎么写', d: '不必规定实现路径。', cue: 146 },
        { i: '约束', t: '只要能证明结果正确', d: 'Agent 就可以换一种方式工作。', cue: 147 }
      ],
    },
    {
      cue: 148, until: 149, type: 'statement',
      section: '09', kicker: '定理证明器 / PROVERS',
      title: ['Lean、Rocq 扛下这份工作'],
      lede: '《Why Lean is faster than Rust》把这个思路演示得很漂亮。',
      keys: [
        { i: 'Lean', t: '把证明写成程序', d: '数学定义清晰的地方，证明器接得住。', cue: 148 },
        { i: 'Rocq', t: '同一类证明助手', d: '把正确性从测试里挪到定理里。', cue: 148 }
      ],
    },
    {
      cue: 150, until: 155, type: 'list',
      section: '09', kicker: 'UNSAFE / THE LANDING',
      title: ['对 Rust 来说，', '最值钱的落点是 unsafe'],
      title1: ['为什么很多人', '不愿上 unsafe'], title2: ['证明之后，', '才敢优化到底'],
      rows: [
        { k: 'UF', t: '现在很多人不愿上 unsafe', d: '哪怕它更快，因为一旦错了，代价完全不值得。', cue: 151 },
        { k: 'BD', t: '这个保守态度是合理的', d: '问题在于它挡住了整条优化路径。', cue: 153 },
        { k: 'OPT', t: '证明之后，才敢优化到底', d: '如果能证明这段 unsafe 不会触发未定义行为，就可以放心压榨性能，而不是靠祈祷和代码评审。', cue: 154 }
      ],
    },
    {
      cue: 156, until: 158, type: 'quote',
      section: '09', kicker: '边界 / BOUNDARY',
      quote: ['安全 API 必须保护使用者，', '无论他怎么滥用。'],
      quoteAt: [156, 157],
      cite: 'BOUNDARY / 一条不能松的边界',
      note: {
        t: 'Rust 态度明确',
        p: 'C++ 经常把未定义行为的责任推回给用户。这条边界一旦松，证明就失去意义。'
      },
    },

    {
      cue: 159, until: 162, type: 'statement',
      section: '10', kicker: '分工 / DIVISION',
      title: ['既然能上证明系统，', '类型系统可以退休吗？'],
      keys: [
        { i: '问题', t: '类型系统是不是可以退休？', d: '都能证明了，为什么还要一套简单规则？', cue: 161 },
        { i: '回答', t: 'Niko 的回答：正相反', d: '不是退休，是继续加倍下注。', cue: 162 }
      ],
    },
    {
      cue: 163, until: 169, type: 'split',
      section: '10', kicker: '易用性 / USABILITY',
      title: ['类型系统简单得多，', '所以流行得多'],
      cols: [
        { h: '类型系统', big: '简单，所以流行', p: ['先用它排掉一大堆烦人的小 bug。'], li: ['规则少，反馈快', '几乎零额外成本', '每天都能用'], cue: 164 },
        { h: '证明系统', big: '强大，但昂贵', alt: true, p: ['你才有证明精力，留给真正重要的事。'], tag: '两类工具不是替代关系，是分工关系。', cue: 166 }
      ],
    },
    {
      cue: 170, until: 179, type: 'compare',
      section: '10', kicker: '同一段逻辑 / SAME LOGIC',
      title: ['语言不同，', '证明成本差很远'],
      title1: ['Java：不看更多代码', '就证不了'], title2: ['Verus：把唯一性', '交给借用检查器'],
      lede: '同一段逻辑：给字段赋值，再断言相等。',
      cols: ['', '还需要什么条件', '结论'],
      rows: [
        { cells: ['Java', '没有别的线程同时在写 this', '看局部代码看不出来'], cue: 170 },
        { cells: ['Rust', '只要 Eq 对 Bar 自反', '断言必然成立'], cue: 173 },
        { cells: ['Verus', '信任借用检查器追踪唯一性', 'SMT 约束小得多'], cue: 177 }
      ],
    },

    {
      cue: 180, until: 182, type: 'statement',
      section: '11', kicker: '下注 / DOUBLE DOWN',
      title: ['所以立场很明确：', '在「编译即正确」上继续加倍下注'],
      lede: 'Rust 的类型系统已经很有表达力，但还有一批它接不住的东西。',
      keys: [
        { i: '已经做到', t: '很有表达力', d: '字段、生命周期、所有权，大部分错误挡在编译期。', cue: 180 },
        { i: '还没做到', t: '还有一批接不住', d: '既有很常见的，也有很花哨的。', cue: 181 }
      ],
    },
    {
      cue: 183, until: 195, type: 'list',
      section: '11', kicker: '三类缺口 / THE GAPS',
      title: ['三类缺口，', '从常见到工程'],
      title1: ['常见的缺口', '与花哨的缺口'], title2: ['工程上的缺口'],
      rows: [
        { k: 'G1', t: '常见的缺口', d: '比如「这个方法只读某一个字段」的视图类型，以及内部引用这样的长期难题。它们不花哨，但天天在写。', cue: 183 },
        { k: 'G2', t: '花哨的缺口', d: '比如「不得记录个人可识别信息」这种合规性质。类型系统现在完全接不住，只能靠人盯。', cue: 187 },
        { k: 'G3', t: '工程上的缺口', d: '现有的 Rust 证明工具虽然酷，但使用过程很别扭，要应付一堆宏和钉死的编译器版本。', cue: 190 }
      ],
    },
    {
      cue: 196, until: 197, type: 'statement',
      section: '11', kicker: '方向 / DIRECTION',
      title: ['方向：逐个抬高上限'],
      lede: '给 Agent 留出证明更复杂性质的空间，别让它卡在绕开类型系统的死胡同里。',
      keys: [
        { i: '向上', t: '抬高上限', d: '让类型系统能表达更多性质。', cue: 196 },
        { i: '向内', t: '别让它绕路', d: '不要逼 Agent 在类型系统外面找出路。', cue: 197 }
      ],
    },

    {
      cue: 198, until: 201, type: 'statement',
      section: '12', kicker: '北极星 / NORTH STAR',
      title: ['北极星：', '不再有 unsafe 代码'],
      lede: '关键是别把 unsafe 理解成关键字。它指的是：对我们写下的每一段 unsafe，我们都有能力证明它不会引发未定义行为。',
      keys: [
        { i: '不是', t: '一个关键字', d: '不是把 unsafe 全部删掉。', cue: 199 },
        { i: '而是', t: '一种证明能力', d: '每一段 unsafe 都被证明不会引发未定义行为。', cue: 200 },
        { i: '结果', t: '不再有 unsafe 代码', d: '不是没有 unsafe 语法，是没有未被证明的 unsafe。', cue: 201 }
      ],
    },
    {
      cue: 202, until: 207, type: 'list',
      section: '12', kicker: '已有进步 / PROGRESS',
      title: ['已有的进步，必须承认'],
      rows: [
        { k: 'A1', t: '哪些代码需要被审计，清楚多了', d: '不再是一笔糊涂账。', cue: 203 },
        { k: 'A2', t: '库必须通过安全 API 边界保护用户', d: '这一点也已经是共识。', cue: 204 },
        { k: 'A3', t: '但标准还得再抬一档', d: '面对 Agent 挖掘漏洞的能力，旧标准挡不住源源不断的 CVE。', cue: 206 }
      ],
    },
    {
      cue: 208, until: 212, type: 'bars',
      section: '12', kicker: '尺度 / THE SCALE',
      title: ['Rust 遇到的是一条溪流，', 'C++ 和 Java 遇到的是一场洪水'],
      bars: [
        { t: 'Rust：一条 CVE 溪流', s: '有类型系统保护', v: '溪流', bar: 24, cue: 209, hot: true },
        { t: 'C++ / Java：一场洪水', s: '缺少同等保护', v: '洪水', bar: 100, cue: 210 }
      ],
    },

    {
      cue: 213, until: 218, type: 'statement',
      section: '13', kicker: '设计 / DESIGN',
      title: ['三根柱子里，', '最弱的一环：设计'],
      lede: '在证明和优化之前，你得先清楚自己在造什么。而当前最先进的做法，基本就是 Markdown 驱动开发。',
      keys: [
        { i: '现状', t: 'Markdown 驱动开发', d: '写文档，然后指望 Agent 认真读。', cue: 216 },
        { i: '问题', t: '这是唯一还没有工具答案的一根', d: '证明和优化都有尺子，设计没有。', cue: 217 }
      ],
    },
    {
      cue: 219, until: 232, type: 'list',
      section: '13', kicker: '方向 / DIRECTIONS',
      title: ['这件事能怎么改？', 'Niko 指了几个方向'],
      title1: ['先把接口和评审拆开'], title2: ['走出传统语言，', '去写建模语言'],
      rows: [
        { k: 'D1', t: '接口从实现里拆出来', d: '方便单独评审接口，或者一眼看出 Agent 在哪动了接口。这带着点当年头文件的复仇意味。', cue: 222 },
        { k: 'D2', t: '至少提供更好的评审工具', d: '让人的注意力落在真正变了的地方，而不是在巨大的 diff 里找线索。', cue: 226 },
        { k: 'D3', t: '走出传统编程语言的范畴', d: '做专用的建模语言，让人在高层设计与不变量上快速迭代，而不必扎进代码里。', cue: 227 },
        { k: 'D4', t: '一本值得读的书', d: 'Kari Wilhelm 的《Principles of Anchor Engineering》，讲如何抽出设计的关键要素，并据此驱动编码。', cue: 230 }
      ],
    },

    {
      cue: 233, until: 241, type: 'statement',
      section: '14', kicker: '结论 / SUMMARY',
      title: ['第一组：', '为什么 Rust 适配 agentic 开发'],
      title1: ['默认性能，', 'profiler 随手可用'], title2: ['更强的护栏，', '加上会微调的 Agent'],
      lede: '全篇收成两组结论。第一组回答 Rust 为什么刚好合适。',
      keys: [
        { i: '01', t: '默认性能就好', d: '惯用写法已经够快，何必多付钱。', cue: 235 },
        { i: '02', t: 'profiler 随手可用', d: '配上工具，想调多细就调多细。', cue: 237 },
        { i: '03', t: '类型系统是更强的护栏', d: '配置得当，还能用 newtype 之类的技巧再加固。', cue: 239 },
        { i: '04', t: 'Agent 极擅长微调性能', d: '旋钮暴露得足够多，它就能一处一处往下拧。', cue: 241 }
      ],
    },
    {
      cue: 242, until: 253, type: 'statement',
      section: '14', kicker: '第二组 / THE SECOND SET',
      title: ['语言设计还能怎么更好'],
      title1: ['加倍下注，', '写清北极星'], title2: ['守住光谱，', '继续扩展'],
      lede: '把宏加类型系统撑起的 DSL 精神带进编译器，覆盖 GPU、深度语言互操作，也接得上定理证明器这类非 token 工具。',
      keys: [
        { i: '01', t: '加倍下注编译即正确', d: '类型系统更能表达。', cue: 243 },
        { i: '02', t: '把北极星写清楚', d: 'unsafe 代码也无不安全。', cue: 245 },
        { i: '03', t: '守住光谱两端', d: '低到内核，高到 GUI。', cue: 247 },
        { i: '04', t: '继续发扬可扩展性', d: 'GPU、互操作、定理证明器。', cue: 251 }
      ],
    },
    {
      cue: 254, until: 255, type: 'statement',
      section: '14', kicker: '总纲 / THE POINT',
      title: ['要做的事，和过去几乎一样'],
      lede: '因为写代码的变成了 Agent，人类的精力转向了代码理解。',
      keys: [
        { i: '写代码', t: '交给 Agent', d: '实现成本正在坍塌。', cue: 254 },
        { i: '理解代码', t: '留给人', d: '判断、取舍、设计，这些反而更值钱。', cue: 255 }
      ],
    },

    {
      cue: 256, until: 259, type: 'quote',
      section: '15', kicker: '收尾 / CLOSING',
      quote: ['一件事的成功标准', '越能被清晰规格化，', '它就越容易。'],
      quoteAt: [257, 258, 259],
      cite: 'Marc Brooker · What’s Easy Now? What’s Hard Now?',
      note: {
        t: '一个反直觉的结论',
        p: '顺着推下去，过去公认很难的会变容易，过去觉得容易的反而更值钱。'
      },
    },
    {
      cue: 260, until: 263, type: 'split',
      section: '15', kicker: '互换 / THE SWAP',
      title: ['容易和困难，正在互换位置'],
      cols: [
        { h: '变容易', big: '实现一个高效的密码学算法', p: ['数学定义清晰，成功标准能被完全规格化，Agent 加证明器就能接手。'], cue: 261 },
        { h: '变得更值钱', big: '做一个独特、有说服力的网站', alt: true, p: ['标准说不清、靠判断和品味，恰恰是人类还站在前面的地方。'], cue: 263 }
      ],
    },
    {
      cue: 264, until: 271, type: 'flow',
      section: '15', kicker: '设计语言 / DESIGN LANGUAGE',
      title: ['最大的动静，', '会来自一种让人直接写出设计的语言'],
      title1: ['人写设计，翻译成护栏'], title2: ['Agent 翻成代码，', '人偶尔看一眼'],
      nodes: [
        { i: '01', t: '人写设计', d: '凭直觉捕获架构与意图', cue: 267 },
        { i: '02', t: '翻译成护栏', d: '类型检查、lint、待证明的定理', cue: 268, hot: true },
        { i: '03', t: 'Agent 翻成代码', d: '传统语言实现', cue: 270 },
        { i: '04', t: '人偶尔看一眼', d: '只在关键处介入', cue: 271 }
      ],
      note: '设计语言让人在极高层捕获架构和意图行为。',
      noteR: '传统语言不会因此变得无趣',
    },
    {
      cue: 272, until: 274, type: 'closing',
      section: '15', kicker: '题目 / THE NEXT PROBLEM',
      title: ['传统语言不会因此变得无趣，', '只是权衡的取舍和从前大不相同。'],
      sub: '这大概就是语言设计者接下来的题目。',
    }
  ]
};
