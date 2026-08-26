# ARG Blueprint

<p align="center">
  <b>面向另类实境游戏（ARG）的可视化剧情蓝图、拟真页面与静态导出工作台。</b>
</p>

<p align="center">
  <a href="https://github.com/GallonHong/ARG-Blueprinter/actions"><img src="https://github.com/GallonHong/ARG-Blueprinter/actions/workflows/ci.yml/badge.svg" alt="CI 状态"></a>
  <img src="https://img.shields.io/badge/Node.js-20.19%2B%20%7C%2022.12%2B-green.svg" alt="Node.js 版本">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MPL--2.0-orange.svg" alt="MPL 2.0 许可证"></a>
  <img src="https://img.shields.io/badge/Vite-8-646CFF.svg" alt="Vite 8">
</p>

ARG Blueprint 把桌面、聊天、搜索、档案与结局等拟真界面组织为可连线的剧情图。创作者可在浏览器中编辑、预览、自检并导出完整静态项目；可选接入 DSH 或 MCP，让 Agent 通过受控的 ARG 命令协作创作。

## 快速开始

### 环境要求

- Node.js **20.19+** 或 **22.12+**（推荐安装当前 LTS）
- npm（随 Node.js 一同安装）

> Vite 8 不支持 Node.js 18。`start-mac.sh` 与 `start-windows.bat` 会在启动前检查版本。

### 启动编辑器

```bash
npm install
npm run dev
```

打开启动后显示的地址，默认是 `http://localhost:5173/`。

也可以使用一键启动脚本：

- Windows：双击 `一键启动-Windows.bat` 或 `start-windows.bat`
- macOS：双击 `一键启动-macOS.command` 或执行 `./start-mac.sh`

## 让自己的 AI 帮你创作

你不需要懂代码。先在编辑器中点“示例项目”看看成品，再选择下面其中一种方式与自己的 AI 协作。

### 方式一：任何聊天 AI 都能用（推荐新手从这里开始）

这一方式适用于普通的 ChatGPT、Claude、Gemini、DeepSeek 等聊天窗口。AI 不会直接连接你的电脑；它可以先帮你梳理页面、线索和跳转关系，再由你在画布中按计划创建。

1. 在 ARG Blueprint 中创建几个页面，或点击“示例项目”。
2. 把下面的提示词完整复制给你常用的 AI，并把方括号中的内容换成自己的故事想法。
3. 让 AI 先给剧情方案；满意后，让它输出清晰的页面、连线和条件分支清单。
4. 在编辑器画布中按清单创建；若希望 AI 直接操作画布，请使用下方的 MCP 方式。
5. 点击“自检”和“预览运行”；如果不满意，继续把结果告诉 AI 让它修改。

```text
你是 ARG Blueprint 剧情工程师。请帮我把一个互动解谜故事做成可执行的 ARG 蓝图。

故事主题：[例如：2003 年一座沿海小城的失踪案]
氛围：[例如：复古论坛、民俗怪谈、逐步失真的日常]
玩家要做什么：[例如：通过电脑桌面、搜索、聊天和档案库找到真相]

请先给我 2 个剧情走向，并说明每个走向中玩家下一步要做什么。
我选定方案后，请输出一个按顺序执行的创作清单：每个页面的名称、页面类型、页面内容、玩家入口、跳转目标和解锁条件。
不要输出系统命令或安装命令。每次修改前先说明会新增或改变哪些页面。
```

> 普通聊天 AI 只负责“写指令”，不会自行修改你的蓝图。这正好让你能先看懂、再确认每一处改动。

### 方式二：让支持 MCP 的 AI 直接操作画布

如果你的 AI 客户端支持添加本地 MCP Server，就可以让 AI 直接读取、创建和检查你的蓝图。它仍会先通过 3088 Bridge 与编辑器同步，修改会自动出现在画布上。

1. 保持编辑器运行；在项目目录启动共享 Bridge：

   ```bash
   npm run bridge
   ```

2. 在 AI 客户端的 MCP 设置中添加下面的配置。将 `/你的/ARG-Blueprinter/绝对路径` 换成项目真实路径。

   ```json
   {
     "mcpServers": {
       "arg-blueprint": {
         "command": "node",
         "args": ["/你的/ARG-Blueprinter/绝对路径/plugins/dsh-arg-plugin/mcp-server.js"],
         "env": {
           "ARG_BLUEPRINT_BRIDGE_URL": "http://127.0.0.1:3088"
         }
       }
     }
   }
   ```

3. 重新打开该 AI 的对话，然后发送：

   ```text
   请使用 arg-blueprint 工具协作创作。先读取当前蓝图；给出计划并等我确认，再修改页面和连线；完成后必须运行自检，并总结改动与发现的问题。
   ```

支持 MCP 的 AI 会使用 `arg_get_blueprint` 了解当前画布、用 `arg_exec` 修改它、再用 `arg_validate` 自检。涉及删除或大范围改写时，请在 AI 客户端中仔细阅读确认提示。

## 你可以创作什么

项目内置 8 类页面与交互类型：

| 类型 | 用途示例 |
| --- | --- |
| `Desktop` | Windows 98 / XP、Mac OS 9、调查员桌面 |
| `Chat` | 微信、QQ、Telegram、Discord、终端通讯 |
| `Search` | 千禧搜索页、门户搜索、终端检索 |
| `Index` | 门户首页、档案目录、Wiki 档案百科 |
| `Browse` | 新闻、论坛、SCP 卷宗、日记、监控记录 |
| `Login` | 后台登录与 BIOS 口令验证 |
| `Files` | 拟真文件夹与档案库 |
| `Ending` | CRT 黑屏、结案书、报纸头版 |

核心创作流程：

1. 新建页面并设定起始节点。
2. 通过连线、桌面图标、搜索规则、聊天选项和登录密码组织剧情分支。
3. 使用预览与“剧情自检”发现孤立页面、断路和不健康的结局路径。
4. 导出 ZIP，得到可部署的 HTML、CSS、JavaScript 与完整蓝图 JSON。

### 所见即所得页面编辑

点画布卡片中的“预览页面”，会在该卡片中展开一个完整页面的缩略预览；点缩略预览右上的“编辑”可进入完整编辑模式。完整预览中虚线框出的文字可直接点击修改；选中文字后可加粗、斜体、下划线、添加马赛克遮挡，或绑定到该页面已有的剧情出口。点“保存内容”后，修改会同步到画布、预览运行器和导出的静态游戏。

## 模板与导入导出

- 仓库附带两个完整可导入示例：[灵异论坛调查模仿（ZIP）](examples/灵异论坛调查模仿.zip) 与 [雾港 2004：第七码头失踪记录（JSON）](examples/雾港2004-第七码头失踪记录.arg-blueprint.json)。第一次打开编辑器时会出现“从一个可玩的案件开始”选择框；之后仍可点“导入”手动选择文件。雾港示例覆盖 8 类页面、主题预设、搜索关键词、登录口令、文件、聊天分支与 3 个结局。
- 内置页面主题可直接在属性面板切换。
- 支持将 `template.html`、`style.css`、`script.js` 与 `template.json` 作为自定义模板导入、保存与复用。
- 可导入先前导出的 `.zip` 或 `arg-blueprint.json`，缺失字段会按当前页面类型补齐安全默认值。
- 导出内容是纯静态 HTML / CSS / JS，无需应用服务器或数据库；可部署到 GitHub Pages、Cloudflare Pages 或任何静态托管服务。

基础项目可以尝试直接打开 `index.html`。为了使浏览器会话状态、动态脚本和高级交互在各浏览器中保持一致，建议用本地静态服务器或静态托管访问导出项目。

### 玩家线索状态

导出的运行时使用 `sessionStorage` 记录玩家在**当前浏览器会话**内访问过的页面，并用它处理线索前置条件。编辑器内的卡片预览和编辑预览不会写入此进度；每次点击“预览运行”或运行器中的“重开”都会从干净进度开始。关闭标签页或浏览器会话后，这些访问记录不保证保留；它不是长期存档功能。

## AI 协作与共享状态（可选）

AI 协作不是启动编辑器的前置条件。未连接 AI 时，编辑、预览、导入导出都可正常使用。

### A. MCP Server（适用于支持 MCP 的 AI）

本项目提供本地 stdio MCP Server：`plugins/dsh-arg-plugin/mcp-server.js`。AI 客户端启动它后，会自动发现五个 `arg_*` 工具；所有请求都会转发到 3088 Bridge，而不是在 MCP 进程中另存一份蓝图。

### B. Prompt Copilot

编辑器内的 DSH 面板会根据当前蓝图整理上下文。剧情头脑风暴、玩家驱动力、解密机制等按钮会填写对应的提示词；你可以复制完整 Prompt 给 DSH，或让已配置 MCP 的 AI 直接协作修改画布。

### C. DSH Agent Plugin

插件位于 `plugins/dsh-arg-plugin/`，为 DSH Agent 注册五个工具：

| 工具 | 用途 |
| --- | --- |
| `arg_get_blueprint` | 获取结构化蓝图上下文 |
| `arg_query` | 查询页面、属性与拓扑 |
| `arg_exec` | 执行 ARG 命令，创建或修改剧情图 |
| `arg_validate` | 运行剧情图健康度检查 |
| `arg_get_presets` | 查询可用页面主题预设 |

按 DSH 的本地插件加载方式安装：

```bash
dsh plugin add ./plugins/dsh-arg-plugin
```

### D. 3088 Shared State Bridge

要让编辑器、DSH Agent 和 MCP Agent 实时使用同一份蓝图状态，请启动 Bridge：

```bash
npm run bridge
```

工作关系如下：

```text
ARG Blueprint UI  ←─ SSE ─→  3088 Shared State Bridge  ←─ HTTP ─→  DSH Agent Plugin
       │                         ▲                              └── MCP Server
       └── 本地修改约 300ms 后同步 ┘
```

Bridge 是共享状态的唯一入口：浏览器会通过 SSE 接收 `STATE_CHANGED`，DSH 与 MCP 的五个工具都会经由 Bridge 请求执行，因此 Agent 执行 `arg_exec` 后可将变更广播给已连接的编辑器。手动“推送 / 拉取”保留为兼容与调试操作，不是主要工作流。

Bridge 固定监听 `127.0.0.1:3088`，只接受来自 `localhost` / `127.0.0.1` 的浏览器跨域请求，不会默认暴露到局域网。

## 项目结构

```text
src/
├── App.jsx                    # 编辑器状态、画布与共享状态连接
├── components/                # 属性、连线、聊天、预览、模板与自检 UI
├── cli.js                     # ARG 命令解析与执行器（供 MCP / DSH 使用）
├── dsh-bridge.js              # DSH Prompt 与浏览器 Shared State 客户端
├── generator.js               # 静态页面生成器
├── project-io.js              # ZIP / JSON 导入导出
├── route-config.js            # 路由、线索和页面跳转契约
├── runtime.js                 # 导出项目的浏览器运行时
├── theme-presets.js           # UI 主题预设
├── types-config.js            # 8 类页面定义与默认字段
└── validator.js               # 剧情图自检
templates/                     # 各页面类型的 HTML / CSS 模板
plugins/dsh-arg-plugin/        # DSH 插件、MCP Server 与 3088 Bridge
tests/                          # 单元、契约、模板审计、全流程和 Bridge 测试
```

## 验证与构建

```bash
# 单元与契约测试
npm test

# 模板审计与完整示例自检
npm run audit:templates
npm run test:self-play

# 执行所有测试
npm run test:all

# 生产构建
npm run build
```

GitHub Actions 会在 Node.js 20.19 和 22.12 上运行完整测试与构建。

## 许可证

本项目基于 [Mozilla Public License 2.0](LICENSE)（MPL-2.0）开源。对本项目源文件的修改须按 MPL-2.0 提供相应源代码；与其组合的独立文件可采用其他许可证。
