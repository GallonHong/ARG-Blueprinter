/**
 * @arg-blueprint/dsh-plugin - DeepSeek Harness Reverse Integration Plugin
 * Reuses ARG Blueprint's native command engine (cli.js) and graph validator (validator.js).
 */

import { executeCliCommand, executeBatchCli } from '../../src/cli.js';
import { validateStoryGraph } from '../../src/validator.js';
import { formatBlueprintForDsh, extractCliScriptFromDshResponse } from '../../src/dsh-bridge.js';
import { getQiyuebanDemoProject } from '../../src/demo-project.js';
import { TYPE_THEME_PRESETS } from '../../src/theme-presets.js';
import { sharedBridgeTools } from './shared-bridge-client.js';

// Active in-memory blueprint state for DSH agent session
let currentBlueprintState = getQiyuebanDemoProject();
let stateUpdateListeners = [];

export const AGENT_RUNTIME_QUALITY_GATE = [
  '先区分编辑预览与真实运行：编辑器卡片预览、所见即所得编辑不得写入玩家线索或访问进度。',
  '每次运行测试必须从干净进度开始；分别验证“未访问前置节点时选项锁定”与“访问全部 requires 节点后选项解锁”。',
  '不要只验证画布连线：从起始页实际检查桌面图标、论坛首页、搜索结果、登录后出口和聊天入口是否都能到达。',
  '论坛首页与单篇论坛帖必须是不同的玩家体验；如果剧情需要两者，就建立首页节点及其到帖子的入口。',
  '示例或导出文件修改后，旧的 blob 运行标签页不会自动刷新；必须重新打开运行器，并提醒用户重新导入已更新的示例文件。',
  'arg_validate 只能验证拓扑与目标引用；完成后仍必须执行以上运行态冒烟测试。'
];

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
 * Tool 1: Execute a single or batch ARG command script
 */
export async function arg_exec({ script }) {
  if (!script) {
    return { success: false, error: '缺少 script 参数，请输入有效的 ARG Blueprint 命令。' };
  }
  const cleanScript = extractCliScriptFromDshResponse(script);
  
  let resultOutput = '';
  try {
    resultOutput = executeBatchCli(cleanScript, currentBlueprintState, (draftFn) => {
      draftFn(currentBlueprintState);
    });
    setBlueprintState(currentBlueprintState);
    if (resultOutput.includes('❌ [ERROR]')) {
      return {
        success: false,
        error: '部分指令执行失败；已保留成功执行的改动，请根据输出修正后重试。',
        executedScript: cleanScript,
        partialOutput: resultOutput,
        currentNodeCount: currentBlueprintState.nodes.length,
        currentEdgeCount: currentBlueprintState.edges.length
      };
    }
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
 * Tool 2: Query blueprint state via read-only ARG commands (ls -l, cat, stat)
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
      },
      runtimeValidationNote: '此报告仅覆盖画布拓扑与引用。完成后仍需按 arg_get_blueprint 返回的 runtimeQualityGate，从干净进度实际运行并验证 requires 的锁定与解锁。'
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
      edgesCount: currentBlueprintState.edges.length,
      runtimeQualityGate: AGENT_RUNTIME_QUALITY_GATE
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Tool 5: Get available theme presets per page type
 */
export async function arg_get_presets({ type = '' } = {}) {
  try {
    if (type && TYPE_THEME_PRESETS[type]) {
      return {
        success: true,
        type,
        presets: TYPE_THEME_PRESETS[type]
      };
    }
    return {
      success: true,
      allPresets: TYPE_THEME_PRESETS
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Cordis / DSH plugin interface ───────────────────────────────────────────
// Mounted by the dsh profile loader as a host-plane tool plugin (see
// cordis.patch.yml): the five arg_* tools register into the DSH `tools`
// registry and become callable by any session's agent.

export const name = 'dsh-arg-plugin';
export const inject = ['tools'];

/** Canonical output: any lossless JSON value, rendered as a text block. */
const jsonTextOutput = {
  schema: {},
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
};

/** Register the five ARG Blueprint tools into the DSH tools registry. */
export function apply(ctx) {
  ctx.tools.register({
    name: 'arg_exec',
    description: '在 ARG Blueprint 中批量执行 ARG 命令（支持 touch、ln、set、rule、contact、msg、choice 等）。修改前先读取 arg_get_blueprint；修改后调用 arg_validate，并按 runtimeQualityGate 从干净进度检查 requires、起始桌面入口、论坛首页与聊天入口。',
    parameters: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: '单行或多行 ARG Blueprint 命令，例如：\ntouch hospital -t Browse -n "废弃医院病历"\nln desktop hospital -p "病历.doc"\nrule search "0717" hospital\ncp hospital morgue -n "地下停尸间"',
        },
      },
      required: ['script'],
    },
    output: jsonTextOutput,
    execute: (args) => sharedBridgeTools.arg_exec(args),
  });

  ctx.tools.register({
    name: 'arg_query',
    description: "在 ARG Blueprint 中执行查询命令（如 'ls -l' 查看全部页面列表、'cat <id>' 读取页面详情、'stat <id>' 查看页面属性和联系人）。",
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
    execute: (args) => sharedBridgeTools.arg_query(args),
  });

  ctx.tools.register({
    name: 'arg_validate',
    description: '调用 ARG Blueprint 图论自检器，检测孤岛、死胡同、断路结局和损坏跳转。它不等同于运行测试：结果会附带必须执行的运行态验收提醒。',
    parameters: { type: 'object', properties: {} },
    output: jsonTextOutput,
    execute: () => sharedBridgeTools.arg_validate(),
  });

  ctx.tools.register({
    name: 'arg_get_blueprint',
    description: '获取当前 ARG Blueprint 全局剧情蓝图的完整 Prompt 上下文，并返回 runtimeQualityGate。任何修改前都应读取；完成后要据此完成运行态验收。',
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
    execute: (args) => sharedBridgeTools.arg_get_blueprint(args),
  });

  ctx.tools.register({
    name: 'arg_get_presets',
    description: '获取 ARG Blueprint 支持的所有 WordPress 级 UI 主题预设库（按 Browse、Chat、Desktop、Search、Login、Files、Ending 页面类型分类）。',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: "可选页面类型: Browse, Chat, Desktop, Search, Login, Files, Ending, Index",
        },
      },
    },
    output: jsonTextOutput,
    execute: (args) => sharedBridgeTools.arg_get_presets(args),
  });
}

// Note: no default export here — dsh's plugin loader unwraps the module's
// default export when present and expects it to carry an `apply` method. The
// Cordis plugin interface (name/inject/apply) is therefore the module's only
// export shape; direct consumers (bridge-server.js, tests) use the named
// tool exports above.
