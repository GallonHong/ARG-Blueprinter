export const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:3088';

export async function callSharedBridge(path, { method = 'GET', body } = {}) {
  const baseUrl = (process.env.ARG_BLUEPRINT_BRIDGE_URL || DEFAULT_BRIDGE_URL).replace(/\/+$/, '');
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (!response.ok && !data.error) data.error = `Bridge request failed (${response.status})`;
    return data;
  } catch (err) {
    return {
      success: false,
      error: `无法连接 ARG Blueprint Shared State Bridge (${baseUrl})：${err.message}。请先运行 npm run bridge。`
    };
  }
}

export const sharedBridgeTools = {
  arg_exec: ({ script }) => callSharedBridge('/api/exec', { method: 'POST', body: { script } }),
  arg_query: ({ command }) => callSharedBridge('/api/query', { method: 'POST', body: { command } }),
  arg_validate: () => callSharedBridge('/api/validate'),
  arg_get_blueprint: ({ focus = '' } = {}) => callSharedBridge(`/api/blueprint?focus=${encodeURIComponent(focus)}`),
  arg_get_presets: ({ type = '' } = {}) => callSharedBridge(`/api/presets?type=${encodeURIComponent(type)}`)
};
