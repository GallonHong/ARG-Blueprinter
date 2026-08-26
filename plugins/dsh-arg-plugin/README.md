# @arg-blueprint/dsh-plugin

**DeepSeek Harness (`dsh`) 官方协同插件 —— 赋能 AI Agent 直接通过原生 Linux CLI 操作 ARG Blueprint 剧情引擎**

---

## 📖 简介

本插件专为 **DeepSeek Harness (`dsh`)**（基于 Cordis 元框架的智能体开发环境）打造。
安装后，DSH Agent 可直接调用 ARG Blueprint 的原生类 Linux 指令（`touch`, `ln`, `set`, `rule`, `contact`, `msg`, `choice`）以及图论自检器（`validateStoryGraph`），实现**大模型与游戏画布的双向实时协同**。

---

## 🛠️ 提供的 Agent Tools (工具列表)

| Tool 名称 | 说明 | 参数示例 |
|-----------|------|---------|
| `arg_exec` | 批量在画布上执行 ARG Linux CLI 指令 | `{ "script": "touch hospital -t Browse -n '医院病历'\nln desktop hospital" }` |
| `arg_query` | 执行只读查询指令（`ls -l` / `cat <id>` / `stat <id>`） | `{ "command": "ls -l" }` |
| `arg_validate` | 执行剧情健康度自检（检测死胡同、孤岛与断路结局） | 无需参数 |
| `arg_get_blueprint` | 获取当前全局剧情拓扑与人物设定 Prompt | `{ "focus": "扩写林警官对话" }` |

---

## 🚀 安装与加载方式

### 方式 1：在 DSH CLI 中一键添加本地插件
```bash
dsh plugin add ./plugins/dsh-arg-plugin
```

### 方式 2：在 DSH Web UI (http://127.0.0.1:3080) 插件管理器中加载
在 DSH 网页端「Plugins / Tools」面板中，点击 **"Add Local Plugin"**，选择目录 `plugins/dsh-arg-plugin` 即可。

### 方式 3：启动本地 HTTP/REST Bridge Server (可选)
如果 DSH 作为远程或隔离进程运行：
```bash
node plugins/dsh-arg-plugin/bridge-server.js
# 启动在 http://127.0.0.1:3088
```

---

## 💬 典型使用提示词 (Prompting DSH)

安装插件后，直接在 DSH 对话框输入自然语言：

> **“在当前故事中，给温水青的电脑桌面添加一个【废弃档案室】图标，并放一篇关于0717案的旧报纸，设置搜索关键词【0717】指向该页面。”**

DSH Agent 将自动调用：
1. `arg_get_blueprint()` 获取上下文；
2. `arg_exec({ script: "touch doc_room -t Browse -n '废弃档案室'\nln desktop doc_room -p '档案室.doc'\nrule search '0717' doc_room" })`；
3. `arg_validate()` 验证连通性。

页面将瞬间在 ARG Blueprint 画布上实时生成！
