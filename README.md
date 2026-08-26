# ARG Blueprint (另类实境游戏/拟真解谜剧本引擎)

<p align="center">
  <b>专注于千禧复古桌面、加密聊天、全网搜索、解密档案与多分支结局的交互式 ARG 创作与离线分发工作台</b>
</p>

---

## 📑 目录

- [一、项目概述](#一项目概述)
- [二、核心特性矩阵](#二核心特性矩阵)
- [三、环境要求与极速启动](#三环境要求与极速启动)
- [四、DeepSeek Harness (dsh) 本地双向联动指南](#四deepseek-harness-dsh-本地双向联动指南)
- [五、完整操作手册与玩法指南](#五完整操作手册与玩法指南)
- [六、Linux CLI 命令行终端完整指令表](#六linux-cli-命令行终端完整指令表)
- [七、事件线索触发与条件解锁机制](#七事件线索触发与条件解锁机制)
- [八、项目架构与目录结构](#八项目架构与目录结构)
- [九、自动化测试与构建验证](#九自动化测试与构建验证)
- [十、开源协议](#十开源协议)

---

## 一、项目概述

**ARG Blueprint** 是一款专为 **ARG（Alternate Reality Game，另类实境游戏 / 拟真解谜剧本）** 设计的专业可视化流程图构建与静态离线分发引擎。

- **0 后端依赖 · 纯前端架构**：所有页面生成、路由映射、密码核验、线索追踪与物理音效均在前端浏览器内部完成。
- **一键打包分发**：支持将整套游戏一键导出为纯静态 HTML/CSS/JS 的 **ZIP 压缩包**，玩家解压后双击 `index.html` 即可在任意浏览器离线畅玩。
- **内置官方高完成度范例**：《灵异论坛调查模仿》（复刻七月半灵异论坛调查记录，含 20 个页面、12 条搜索规则、多联系人分支及 5 大完整结局）。

---

## 二、核心特性矩阵

| 特性模块 | 核心能力 |
|---|---|
| 🖥️ **7 大拟真交互页面类型** | 涵盖 **桌面 (Desktop)**、**微信/QQ 聊天 (Chat)**、**全网搜索引擎 (Search)**、**BBS 论坛/新闻报道 (Browse)**、**机密密码锁 (Login)**、**绝密档案库 (Files)**、**通关结局 (Ending)** |
| ⚡ **Linux 风格内置命令行 (CLI)** | 支持按快捷键 **`Ctrl + \``** 打开终端，通过 `touch`, `ln`, `set`, `rule`, `contact`, `msg`, `choice` 极速批量构建画布与拓扑关系 |
| 🔒 **线索追踪与动态解锁中枢** | 告别开局剧透！游戏运行时自动感知玩家已读档案与收集的物证，动态冒泡点亮对应聊天选项；内置全局 **「🔒 事件线索」测试台** 实时模拟触发效果 |
| 🩺 **图论剧情健康度与死胡同自检** | 基于 BFS 算法毫秒级扫描全图，检测 **孤岛卡片**、**非结局死胡同页面**、**断路结局** 与 **损坏的关键词目标**，支持一键平移缩放定位 |
| 🎵 **Web Audio 纯合成物理音效** | **0 外部 MP3 依赖**，基于 Web Audio API 物理振荡器实时合成机械打字声、按键声、即时通讯提示音（D5->A5）、保险箱四和弦解密音与错误蜂鸣 |
| ⌨️ **打字机排字与多媒体滤镜** | 正文文本平滑逐字排字（支持点击/按键极速跳过）；提供 **CRT 复古扫描线**、**四周暗影暗角**、**画面微弱故障闪烁** 等氛围滤镜 |
| 🤖 **DeepSeek Harness (`dsh`) 协同** | 深度打通 DeepSeek 官方 Agent 框架（默认端口 `http://127.0.0.1:3080`），提供双向通信桥与 Cordis 专属插件 `dsh-arg-plugin` |

---

## 三、环境要求与极速启动

### 1. 前置环境
- **Node.js**：`>= 18.0.0` (推荐 Node.js LTS 20 或更高版本)
- **包管理器**：`npm` (随 Node.js 自带)

### 2. 克隆与安装依赖
```bash
# 1. 进入项目根目录
cd d:\arg-blueprint

# 2. 安装全部依赖
npm install
```

### 3. 本地开发服务器启动
```bash
npm run dev
```
启动成功后，浏览器访问：**`http://localhost:5173/`** 即可进入 ARG Blueprint 可视化工作台。

### 4. 生产构建打包
```bash
npm run build
```
编译产物将输出至 `dist/` 目录，极度精简，秒级加载。

### 5. 独立离线游戏包生成
```bash
node scratch/build_zip_standalone.mjs
```
会在项目根目录重新打包并生成 `灵异论坛调查模仿.zip`，可直接解压在离线环境下运行。

---

## 四、DeepSeek Harness (dsh) 本地双向联动指南

[DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 是 DeepSeek AI 开源的插件化智能体（Agent）开发框架。ARG Blueprint 提供了**正向协同中枢**与**反向 DSH 插件**的双向深度联动：

```
 ┌─────────────────────────────────────────────────────────────┐
 │  ARG Blueprint (主工作台)                                    │
 │  顶栏：[ DSH 联动 ● 3080 ]                                  │
 │                                                             │
 │  1. 结构化打包 20 节点世界观 Prompt ──▶ 发送给 DSH Agent    │
 │  2. 接收 DSH 编写的 Linux Shell 脚本 ◀── 实时在画布上生成页面│
 └──────────────────────────────┬──────────────────────────────┘
                                │ 本地端口 HTTP / postMessage
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  本地 DeepSeek Harness 服务 (http://127.0.0.1:3080)          │
 │  (GitHub: https://github.com/deepseek-ai/deepseek-harness)  │
 │  已挂载插件：plugins/dsh-arg-plugin                         │
 └─────────────────────────────────────────────────────────────┘
```

### 1. 正向联动：在 ARG Blueprint 中调用 DSH 扩写剧本
- **默认端点**：`http://127.0.0.1:3080`（支持在界面中自由修改并持久化到本地存储）。
- **顶栏状态指示**：顶栏常驻 `DSH 联动 [● 3080]`，绿色表示本地服务在线，灰色表示未检测到服务。
- **AI 剧情协同助手 (Co-pilot)**：
  - 点击顶栏「DSH 联动」，内置四大解谜剧情预设：
    - 🧩 **完整谜题链生成**：一句话生成“桌面 + 搜索 + 聊天 + 密码箱 + 结局”全套链路。
    - 💬 **NPC 深度审讯对话扩写**：为指定角色扩充多轮带选项分支的逼真对话。
    - 🔍 **搜索库线索扩充**：为搜索引擎自动生成 10 组关联关键词与背景新闻。
    - 🔐 **密码锁暗号设计**：在日记与新闻中自动埋入藏头诗/拼音密码暗号。
  - **一键执行**：DSH 生成的脚本可以直接粘贴或点击 **「⚡ 立即执行并在画布上生成页面」**，画布瞬间生长出对应卡片。
- **内嵌 Webview 模式**：可在右侧抽屉直接内嵌查看 DSH 本地浏览器页面，免去切屏烦恼。

### 2. 反向联动：在 DSH 中作为 Tool 插件操控 ARG Blueprint
在 `plugins/dsh-arg-plugin/` 中，我们为 DSH 编写了专有插件。该插件**直接复用了 ARG Blueprint 已有的 Linux CLI 解释器与自检器（0 重复造轮子）**。

#### DSH 插件暴露给 Agent 的 4 大核心工具：
1. **`arg_exec({ script })`**：让 DSH Agent 直接通过标准 Linux CLI 批量执行 `touch`, `ln`, `set`, `rule`, `contact`, `msg`, `choice` 指令。
2. **`arg_query({ command })`**：让 DSH Agent 通过只读指令（`ls -l`, `cat <id>`, `stat <id>`）查看当前蓝图状态。
3. **`arg_validate()`**：调用图论自检器，获取死胡同和孤岛卡片报告，让 AI Agent **自主修复断开的连线**。
4. **`arg_get_blueprint()`**：提取当前全图 20 个节点的结构化 Prompt 上下文。

#### 加载方式：
```bash
# 在 DSH 中加载本地插件
dsh plugin add ./plugins/dsh-arg-plugin

# 或启动独立 HTTP 中继服务 (端口 3088)
node plugins/dsh-arg-plugin/bridge-server.js
```

---

## 五、完整操作手册与玩法指南

### 1. 可视化画布基础操作
- **画布平移与缩放**：按住鼠标左键在空白处拖拽即可平移画布；滚动鼠标滚轮可平滑缩放（40% ~ 250%）。
- **新建节点**：点击左侧列表顶部的「＋」按钮，或在属性检查器为空时点击对应类型卡片。
- **建立连线**：鼠标移动到卡片右侧的圆点（端口），按住左键拖拽连线至目标卡片松开即可建立跳转。
- **双击预览**：双击任意卡片可在弹窗中立即进入该页面的交互预览。
- **设为起始页**：点击卡片右上角或检查器中的「设为起始页」，游戏将固定以该页面作为开局 `index.html`。
- **撤销与重做**：快捷键 `Ctrl + Z`（撤销）与 `Ctrl + Y` / `Ctrl + Shift + Z`（重做）。

### 2. 7 大页面类型配置详解

#### (1) 🖥️ 桌面页 (Desktop)
- **用途**：作为游戏主桌面或电脑系统入口，摆放各类应用程序图标与文档。
- **配置**：在「连接出口 / 桌面图标」中添加图标，可选择系统预设 Emoji/图标图案或上传自定义图片，并设置图标文字与点击打开的目标页面。

#### (2) 💬 聊天页 (Chat)
- **用途**：即时加密通讯软件（如微信 UI、QQ、Telegram、Discord 风格）。
- **配置**：
  - 支持创建多个联系人（设置姓名、头像、个性签名/IP）。
  - **对话序列**：可添加 NPC 消息，或添加「玩家选项分支（Choice）」。
  - **选项前置要求**：在选项下方选择 `🔒 解锁前置线索`，设置该选项何时可见。

#### (3) 🔍 搜索页 (Search)
- **用途**：全网线索搜索引擎（如百度、谷歌、千禧搜索界面）。
- **配置**：在「内容与规则」中添加关键词规则（如输入 `失踪` ➔ 跳转至 `node_news_shizong`）。支持设置搜索未找到时的提示文案。

#### (4) 🌐 浏览页 (Browse)
- **用途**：展示 BBS 论坛帖子、新闻报道、古籍文献、审讯口供等长文本。
- **配置**：输入页面标题、正文内容，或插入超链接跳转出口。

#### (5) 🔐 登录页 (Login)
- **用途**：机密文件夹密码锁或保险箱，阻断未授权访问。
- **配置**：设置正确验证密码（如 `0717` 或 `yxzyddx`），以及密码正确后跳转的目标页面（如机密档案库）。

#### (6) 📁 档案页 (Files)
- **用途**：文件资源管理器，陈列破译后的绝密案卷。

#### (7) 🏆 结局页 (Ending)
- **用途**：宣告通关或达成特定分支结局。自检器会自动识别结局节点，豁免出口检查。

---

## 六、Linux CLI 命令行终端完整指令表

按下 **`Ctrl + \``**（或点击顶栏「终端」）可唤出 Linux 控制台，支持单行命令与多行批量脚本（支持 `#` 注释）：

| 指令 | 语法格式 | 说明与示例 |
|---|---|---|
| `touch` / `mkpage` | `touch <id> -t <Type> -n "<名称>" [--start]` | 创建页面节点：`touch hospital -t Browse -n "废弃医院"` |
| `ln` | `ln <from> <to> [-p "<按键名>"] [--icon "<图标>"]` | 建立连线出口：`ln node_desktop hospital -p "病历.doc"` |
| `unlink` / `rmlink` | `unlink <from> <to>` | 断开两个节点间的连线：`unlink node_desktop hospital` |
| `set` | `set <id> <key>="<val>"` | 修改属性或密码：`set node_login password="0717"` |
| `rule` | `rule <search_id> "<关键词>" <target_id>` | 为搜索引擎配置规则：`rule node_search "0717" hospital` |
| `rmrule` | `rmrule <search_id> "<关键词>"` | 删除指定的搜索规则：`rmrule node_search "0717"` |
| `contact` | `contact <chat_id> "<姓名>" [--bio "<简介>"]` | 添加聊天联系人：`contact node_chat "林警官"` |
| `msg` | `msg <chat_id> "<联系人>" <npc\|player> "<内容>"` | 追加对话消息：`msg node_chat "林警官" npc "案卷在此"` |
| `choice` | `choice <chat_id> "<姓名>" "<文案>" <target> [--req "<前置节点>"] [--reply "<回复>"]` | 添加选项分支与前置条件：`choice node_chat "林警官" "提交证据" node_end3 --req "hospital"` |
| `start` | `start <id>` | 将指定节点设为游戏开局起始页：`start node_desktop` |
| `ls` | `ls [-l]` | 列出当前所有页面节点及出口数量 |
| `cat` | `cat <id>` | 查看指定节点的详细属性与正文配置 |
| `stat` | `stat <id>` | 查看指定节点的拓扑连线与联系人状态 |
| `rm` / `del` | `rm <id>` | 删除指定页面及其关联连线：`rm hospital` |
| `mv` | `mv <old_id> <new_id>` | 重命名节点 ID：`mv old_page new_page` |
| `dsh` | `dsh status` / `dsh connect <url>` / `dsh sync` | 查看/切换 DSH 本地端点或导出 Prompt 上下文 |
| `clear` | `clear` | 清空终端控制台输出屏幕 |
| `help` | `help [cmd]` | 查看全部可用指令帮助说明 |

---

## 七、事件线索触发与条件解锁机制

为了避免解谜游戏中“开局剧透结局”的问题，ARG Blueprint 内置了**轻量级线索感知与条件解锁状态机**：

### 1. 运作原理
1. **自动收集**：当玩家在游戏过程中进入特定页面（如新闻、日记、密码箱），运行器自动将该节点 ID 记入 `sessionStorage` 的 `arg_visited_nodes`。
2. **条件判定**：聊天选项配置了 `requires: 'node_news_shizong'` 时，只有玩家背包中存在该线索，选项才会动态点亮并冒泡浮现。
3. **未解锁保护**：开局未收集线索时，聊天底部展示指引文案：*“（暂无可提交的调查物证。请先在电脑桌面、灵异论坛与全网搜索引擎中搜集线索...）”*。

### 2. 全局事件与线索中枢窗口 (`EventsModal`)
点击顶栏 **「🔒 事件线索」** 按钮可打开全屏管理工作台：
- **线索产出源列表**：汇总全图所有可产生线索的页面。
- **🎮 剧情事件模拟器 (Live Testbed)**：创作者可自由勾选/取消勾选不同线索组合，右侧将实时演算并呈现各个选项是处于 **「✓ 已解锁」** 还是 **「🔒 锁定中」**，并支持一键定位到对应卡片。

---

## 八、项目架构与目录结构

```
d:/arg-blueprint/
├── index.html                    # Vite 入口 HTML
├── style.css                     # 全局现代低饱和 Zinc 调色盘与氛围着色器样式
├── src/
│   ├── main.jsx                  # React 挂载入口与顶层 ErrorBoundary 错误边界
│   ├── App.jsx                   # 主编辑器工作台（画布、顶栏、检查器、停靠栏）
│   ├── runtime.js                # 纯合成 Web Audio、打字机动效与线索解锁运行时内核
│   ├── validator.js              # 图论剧情健康度与死胡同分析引擎 (BFS)
│   ├── EventsModal.jsx           # 全局事件与线索中枢管理器组件
│   ├── DshPanel.jsx              # DeepSeek Harness (dsh) 协同工作台与 Webview 抽屉
│   ├── dsh-bridge.js             # DSH 端口通信、心跳检测与 Prompt 上下文格式化
│   ├── cli.js                    # Linux CLI 命令行解释与批量脚本执行引擎
│   ├── generator.js              # HTML 单页渲染与独立打包代码生成器
│   ├── route-config.js           # 路由契约映射与动态数据注入
│   ├── demo-project.js           # 官方范例《灵异论坛调查模仿》20 节点初始数据
│   ├── templates.js              # 自定义模板管理器与预设加载器
│   ├── Terminal.jsx              # 内置 Linux 终端抽屉组件
│   ├── editor.css                # 检查器与表单样式
│   └── link-editor.css           # 连线卡片与图标配置样式
├── plugins/
│   └── dsh-arg-plugin/           # 📦 DeepSeek Harness 专属 Cordis 反向插件
│       ├── package.json          # 插件元信息 (@arg-blueprint/dsh-plugin)
│       ├── manifest.json         # DSH / Cordis 插件 Tool Schema
│       ├── index.js              # 插件核心逻辑（桥接 cli.js & validator.js）
│       ├── bridge-server.js      # 轻量本地 HTTP/REST Bridge Server (端口 3088)
│       └── README.md             # DSH 用户安装与配置说明
├── templates/                    # 内置 7 大类主题模板 (HTML / CSS / JS)
│   ├── chat/                     # 微信 UI、QQ、Telegram、Discord、Terminal 风格
│   ├── desktop/                  # Windows 98/2000 复古桌面
│   ├── search/                   # 千禧搜索引擎风格
│   ├── browse/                   # 复古 BBS 论坛、调查新闻、泛黄日记、调查文献
│   ├── login/                    # 绝密安全密码锁
│   ├── files/                    # 机密档案库资源管理器
│   └── ending/                   # 结局展示模板
├── tests/                        # 自动化测试用例集
│   ├── cli.test.mjs              # Linux CLI 指令测试
│   ├── dsh.test.mjs              # DSH 端口与 Prompt 格式化测试
│   ├── dsh_plugin.test.mjs       # DSH 反向插件 Tool 测试
│   ├── validator.test.mjs        # 图论死胡同与孤岛自检测试
│   ├── contract.test.mjs         # 页面生成与契约验证测试
│   └── self_play_full_game.mjs   # 全剧情 20 节点自检模拟演练
└── 灵异论坛调查模仿.zip            # 独立离线游戏分发压缩包 (29 KB)
```

---

## 九、自动化测试与构建验证

项目具备严密的自动化测试覆盖，确保每一次迭代均零回归：

```bash
# 运行全量 28 项单元测试契约
npm test

# 运行全剧情 20 节点通关链路模拟演练
node --test tests/self_play_full_game.mjs

# 执行生产环境毫秒级打包
npm run build
```

---

## 十、开源协议

本项目基于 **MIT License** 开源协议发布，欢迎自由扩展、二创与分发您的 ARG 互动解谜游戏！
