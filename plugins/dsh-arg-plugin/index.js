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

// Cordis / DSH Plugin Standard Interface
export default {
  name: 'dsh-arg-plugin',
  description: 'DeepSeek Harness Plugin for ARG Blueprint Engine',
  tools: {
    arg_exec,
    arg_query,
    arg_validate,
    arg_get_blueprint
  }
};
