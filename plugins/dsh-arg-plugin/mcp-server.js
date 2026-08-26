#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { sharedBridgeTools } from './shared-bridge-client.js';

const VERSION = '1.0.1';

const RUNTIME_QUALITY_GATE = '强制质量门槛：编辑预览不得收集玩家线索；真实运行必须从干净进度分别验证 requires 的锁定与解锁；不要只看连线，需检查起始桌面的图标、论坛首页、聊天入口、搜索与登录出口；arg_validate 仅验证拓扑，不能替代运行态冒烟测试；示例更新后提醒用户重新打开运行器并重新导入旧示例。';

function toMcpResult(data) {
  const isError = data?.success === false || Boolean(data?.error);
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    isError
  };
}

export function createMcpServer() {
  const server = new McpServer(
    { name: 'arg-blueprint', version: VERSION },
    {
      instructions: `ARG Blueprint 的所有工具都操作本机 3088 Shared State Bridge。先调用 arg_get_blueprint 理解现有故事；修改后调用 arg_validate。arg_exec 会改变创作蓝图，请在执行前向用户说明计划。${RUNTIME_QUALITY_GATE}`
    }
  );

  server.registerTool(
    'arg_get_blueprint',
    {
      title: '读取 ARG 蓝图',
      description: '读取当前剧情图、页面、连线、结构化上下文及运行态质量门槛。任何创作或修改前都应先调用它。',
      inputSchema: z.object({ focus: z.string().max(2000).optional().describe('可选：本次创作关注点') })
    },
    async ({ focus }) => toMcpResult(await sharedBridgeTools.arg_get_blueprint({ focus }))
  );

  server.registerTool(
    'arg_query',
    {
      title: '查询 ARG 页面',
      description: '运行只读 ARG CLI 查询，例如 ls -l、cat <id> 或 stat <id>。',
      inputSchema: z.object({ command: z.string().min(1).max(4000).describe('只读 ARG CLI 查询命令') })
    },
    async ({ command }) => toMcpResult(await sharedBridgeTools.arg_query({ command }))
  );

  server.registerTool(
    'arg_exec',
    {
      title: '修改 ARG 蓝图',
      description: '执行 ARG CLI 脚本来创建或修改页面、连线、线索规则、聊天与主题。执行前应向用户说明修改；执行后必须进行结构自检与干净进度的运行态验收。',
      inputSchema: z.object({ script: z.string().min(1).max(20000).describe('一行或多行 ARG CLI 脚本') })
    },
    async ({ script }) => toMcpResult(await sharedBridgeTools.arg_exec({ script }))
  );

  server.registerTool(
    'arg_validate',
    {
      title: '自检 ARG 剧情图',
      description: '检查孤岛页面、死胡同、断路结局和失效跳转。仅覆盖结构，不能替代 requires 锁定/解锁及玩家入口的真实运行测试。',
      inputSchema: z.object({})
    },
    async () => toMcpResult(await sharedBridgeTools.arg_validate())
  );

  server.registerTool(
    'arg_get_presets',
    {
      title: '获取页面主题预设',
      description: '获取全部主题，或查询某个页面类型可用的主题预设。',
      inputSchema: z.object({ type: z.string().max(40).optional().describe('可选页面类型，例如 Browse、Chat 或 Index') })
    },
    async ({ type }) => toMcpResult(await sharedBridgeTools.arg_get_presets({ type }))
  );

  return server;
}

if (process.argv[1]?.endsWith('mcp-server.js')) {
  serveStdio(createMcpServer, { onerror: error => {
    console.error('[ARG Blueprint MCP] Failed to start:', error);
  }});
}
