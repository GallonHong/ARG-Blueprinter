/**
 * @arg-blueprint/dsh-plugin - DeepSeek Harness Reverse Integration Plugin
 * Reuses ARG Blueprint's native Linux CLI commands (cli.js) and graph validator (validator.js).
 */

import { executeCliCommand, executeBatchCli } from '../../src/cli.js';
import { validateStoryGraph } from '../../src/validator.js';
import { formatBlueprintForDsh, extractCliScriptFromDshResponse } from '../../src/dsh-bridge.js';
import { getQiyuebanDemoProject } from '../../src/demo-project.js';

// Active in-memory blueprint state for DSH agent session
let currentBlueprintState = getQiyuebanDemoProject();
let stateUpdateListeners = [];

export function getBlueprintState() {
  return currentBlueprintState;
}

export function setBlueprintState(newState) {
  currentBlueprintState = newState;
  stateUpdateListeners.forEach(fn => fn(currentBlueprintState));
}

export function onBlueprintChange(listener) {
  stateUpdateListeners.push(listener);
  return () => {
    stateUpdateListeners = stateUpdateListeners.filter(fn => fn !== listener);
  };
}

/**
 * Tool 1: Execute single or batch Linux CLI script
 */
export async function arg_exec({ script }) {
  if (!script) {
    return { success: false, error: '缺少 script 参数，请输入有效的 ARG Linux CLI 指令。' };
  }
  const cleanScript = extractCliScriptFromDshResponse(script);
  
  let resultOutput = '';
  try {
    resultOutput = executeBatchCli(cleanScript, currentBlueprintState, (draftFn) => {
      draftFn(currentBlueprintState);
    });
    setBlueprintState(currentBlueprintState);
    return {
      success: true,
      executedScript: cleanScript,
      output: resultOutput || '[OK] 指令执行成功',
      currentNodeCount: currentBlueprintState.nodes.length,
      currentEdgeCount: currentBlueprintState.edges.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      partialOutput: resultOutput
    };
  }
}

/**
 * Tool 2: Query blueprint state via read-only Linux CLI commands (ls -l, cat, stat)
 */
export async function arg_query({ command }) {
  if (!command) {
    return { success: false, error: '缺少 command 参数，例如: ls -l, cat node_login' };
  }
  try {
    const res = executeCliCommand(command.trim(), currentBlueprintState, () => {});
    if (res.error) {
      return { success: false, error: res.error };
    }
    return {
      success: true,
      command,
      output: res.output
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Tool 3: Run graph validation and return dead-ends, orphans, and broken links
 */
export async function arg_validate() {
  try {
    const report = validateStoryGraph(currentBlueprintState);
    return {
      success: true,
      healthy: report.healthy,
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      summary: report.summary,
      issues: report.issues,
      stats: {
        reachableCount: report.reachableCount,
        totalCount: report.totalCount,
        endingCount: report.endingCount
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Tool 4: Get full structured blueprint prompt context
 */
export async function arg_get_blueprint({ focus = '' } = {}) {
  try {
    const prompt = formatBlueprintForDsh(currentBlueprintState, focus);
    return {
      success: true,
      context: prompt,
      title: currentBlueprintState.title,
      nodesCount: currentBlueprintState.nodes.length,
      edgesCount: currentBlueprintState.edges.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Cordis / DSH plugin interface ───────────────────────────────────────────
// Mounted by the dsh profile loader as a host-plane tool plugin (see
// cordis.patch.yml): the four arg_* tools register into the DSH `tools`
// registry and become callable by any session's agent.

export const name = 'dsh-arg-plugin';
export const inject = ['tools'];

/** Canonical output: any lossless JSON value, rendered as a text block. */
const jsonTextOutput = {
  schema: {},
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
};

/** Register the four ARG Blueprint tools into the DSH tools registry. */
export function apply(ctx) {
  ctx.tools.register({
    name: 'arg_exec',
    description: '在 ARG Blueprint 中批量执行 Linux CLI 指令（支持 touch 创建页面、ln 建立连线、set 设置属性密码、rule 配置搜索词、contact 添加联系人、msg 追加对话、choice 添加选项分支）。',
    parameters: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: '单行或多行 ARG Blueprint Linux CLI 指令，例如：\ntouch hospital -t Browse -n "废弃医院病历"\nln desktop hospital -p "病历.doc"\nrule search "0717" hospital',
        },
      },
      required: ['script'],
    },
    output: jsonTextOutput,
    execute: (args) => arg_exec(args),
  });

  ctx.tools.register({
    name: 'arg_query',
    description: "在 ARG Blueprint 中执行查询类 Linux 指令（如 'ls -l' 查看全部页面列表、'cat <id>' 读取页面详情、'stat <id>' 查看页面属性和联系人）。",
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: "查询指令，例如 'ls -l' 或 'cat node_login' 或 'stat node_chat'",
        },
      },
      required: ['command'],
    },
    output: jsonTextOutput,
    execute: (args) => arg_query(args),
  });

  ctx.tools.register({
    name: 'arg_validate',
    description: '调用 ARG Blueprint 图论自检器，检测当前剧情中是否存在孤岛卡片、死胡同页面、断路结局或损坏的关键词跳转目标。',
    parameters: { type: 'object', properties: {} },
    output: jsonTextOutput,
    execute: () => arg_validate(),
  });

  ctx.tools.register({
    name: 'arg_get_blueprint',
    description: '获取当前 ARG Blueprint 全局剧情蓝图的完整 Prompt 上下文（包含所有已有页面、人物、连线拓扑和语法规范）。',
    parameters: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          description: "可选关注焦点，例如 '扩写林警官的审讯对话' 或 '设计暗号密码锁'",
        },
      },
    },
    output: jsonTextOutput,
    execute: (args) => arg_get_blueprint(args),
  });
}

// Note: no default export here — dsh's plugin loader unwraps the module's
// default export when present and expects it to carry an `apply` method. The
// Cordis plugin interface (name/inject/apply) is therefore the module's only
// export shape; direct consumers (bridge-server.js, tests) use the named
// tool exports above.
