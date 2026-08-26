# @arg-blueprint/dsh-plugin

ARG Blueprint 的 AI 协作包。它包含 DSH 集成插件与 stdio MCP Server，可让 AI Agent 通过 ARG Blueprint 命令查询、修改并校验剧情蓝图。

> 这不是 DeepSeek 或 DSH 官方发布、背书的插件；它由 ARG Blueprint 项目维护。

## 提供的 Agent Tools

| Tool | 说明 | 参数示例 |
| --- | --- | --- |
| `arg_exec` | 批量执行 ARG CLI，创建或修改页面、连线、规则和对话 | `{ "script": "touch hospital -t Browse -n '医院病历'" }` |
| `arg_query` | 运行只读查询，如 `ls -l`、`cat <id>`、`stat <id>` | `{ "command": "ls -l" }` |
| `arg_validate` | 检查孤岛、死胡同、断路结局与失效跳转 | 无 |
| `arg_get_blueprint` | 获取蓝图、拓扑与当前上下文 | `{ "focus": "扩写林警官对话" }` |
| `arg_get_presets` | 返回页面类型的可用主题预设 | `{ "type": "Browse" }` |

## 安装

在项目根目录执行：

```bash
dsh plugin add ./plugins/dsh-arg-plugin
```

也可以在 DSH Web UI 的 Plugins / Tools 面板中选择本目录加载。

## MCP Server（适用于支持 MCP 的 AI）

MCP Server 位于 `mcp-server.js`，由 AI 客户端通过 stdio 自动启动。它公开与 DSH 相同的五个工具，并将调用转发给 3088 Bridge。

在 MCP 客户端中添加类似配置（替换为项目绝对路径）：

```json
{
  "mcpServers": {
    "arg-blueprint": {
      "command": "node",
      "args": ["/绝对路径/ARG-Blueprinter/plugins/dsh-arg-plugin/mcp-server.js"],
      "env": {
        "ARG_BLUEPRINT_BRIDGE_URL": "http://127.0.0.1:3088"
      }
    }
  }
}
```

启动编辑器后，请在项目根目录启动 `npm run bridge`。普通聊天 AI 没有 MCP 功能时，仍可以让 AI 输出页面与剧情结构清单，再由创作者在画布中完成。

## 实时共享状态

如果 DSH 与编辑器运行在不同进程中，必须先启动 3088 Bridge，才能让 Agent 与浏览器使用同一份蓝图状态：

```bash
npm run bridge
```

Bridge 监听 `http://127.0.0.1:3088`，并作为状态唯一入口：

```text
ARG Blueprint UI  ←─ SSE ─→  3088 Bridge  ←─ HTTP ─→  DSH Plugin / MCP Server
```

注册给 DSH 的五个 `arg_*` 工具都会调用 Bridge；`arg_exec` 成功后，Bridge 会向已连接的浏览器发送 `STATE_CHANGED` 事件。Bridge 仅绑定回环地址，且浏览器跨域请求仅允许来自 `localhost` / `127.0.0.1`。

如需改变 Bridge 地址，可在启动 DSH 前设置 `ARG_BLUEPRINT_BRIDGE_URL`，例如：

```bash
ARG_BLUEPRINT_BRIDGE_URL=http://127.0.0.1:3088 dsh
```

## 提示词示例

> 在当前故事中，给温水青的电脑桌面添加一个“废弃档案室”图标，并放一篇关于 0717 案的旧报纸；设置搜索关键词“0717”指向该页面，最后检查是否存在断路。

Agent 可依次调用 `arg_get_blueprint`、`arg_exec` 和 `arg_validate` 完成这项工作。

## 运行态质量门槛：本次问题复盘

`arg_validate` 能发现图上的断路和损坏引用，但它**不是实际游玩测试**。以下清单已同时写入 MCP Server 指令、DSH 工具说明，以及 `arg_get_blueprint` 的返回结果；Agent 在创建或修改剧情后必须按此验收。

1. **隔离编辑与游戏进度。** 卡片缩略预览、所见即所得编辑和运行中的游戏是三个不同场景。编辑预览绝不能把“已访问页面”写入玩家线索状态，否则 `requires` 条件会在真正开局前被错误解锁。
2. **始终从干净进度验证条件分支。** 对每个带 `requires` 的聊天选项或条件出口，先确认未访问对应节点时不可见，再访问全部前置节点确认它正确出现。不要用已经玩过一轮的标签页判断。
3. **按玩家入口检查，而非只看节点存在。** 从起始页实际检查桌面图标、论坛首页、搜索结果、登录成功后的去向和聊天软件入口。画布里有 Chat / Browse 节点，不代表玩家一定能到达它。
4. **区分论坛首页与论坛帖子。** 需要“论坛”体验时，首页是入口；具体目击帖、附件或私信是后续内容。不要用一篇帖子冒充论坛首页。
5. **更新示例后重开。** `blob:` 运行标签页是生成时的快照，不会随编辑器热更新；示例 JSON / ZIP 修改后，必须新开运行器。已导入旧示例的用户也需要重新导入文件，不能默认为其本地项目静默覆盖。

推荐执行顺序：`arg_get_blueprint` → `arg_exec` → `arg_validate` → 从干净进度进行一次真实游玩冒烟测试 → 向用户说明需要重新打开运行器或重新导入示例（如适用）。
