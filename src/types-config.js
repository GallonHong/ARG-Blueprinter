export const TYPES = {
  Chat: {
    label: '聊天页',
    templates: ['微信 UI 风格', '经典 QQ 风格', '暗黑加密通讯', 'Discord 社区频道', 'Telegram 风格'],
    fields: [
      ['siteName', '聊天应用标题', '微信聊天'],
      ['primaryColor', '玩家气泡强调色', '#95ec69'],
      ['bgColor', '背景色', '#f0f2f5'],
      ['cardBg', '聊天卡片背景色', '#ffffff'],
      ['textColor', '文字颜色', '#333333'],
      ['fontFamily', '字体风格', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Desktop: {
    label: '桌面页',
    templates: ['Windows 98 桌面', 'Windows XP 桌面', 'Mac OS 9 桌面', '赛博朋克桌面', '调查员工作台'],
    fields: [
      ['systemName', '系统 / 主机名称', 'Windows 98 Second Edition'],
      ['stickyNote', '桌面备忘录 / 便签', '📌 案件调查备忘：\n1. 查阅 0717 卷宗。\n2. 登录档案库后台核对嫌疑人名单。'],
      ['startTitle', '开始菜单文字', '开始'],
      ['time', '任务栏时间', '1998-07-17 23:17'],
      ['primaryColor', '主色调 / 强调色', '#000080'],
      ['bgColor', '桌面背景色 / 壁纸', '#008080'],
      ['cardBg', '任务栏背景色', '#c0c0c0'],
      ['textColor', '文字颜色', '#ffffff'],
      ['fontFamily', '字体风格', '"MS Sans Serif", "SimSun", "宋体", sans-serif'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Search: {
    label: '搜索页',
    templates: ['经典搜索', '终端搜索', '1999 门户搜索'],
    fields: [
      ['siteName', '站点名称', '百度搜索'],
      ['subtitle', '副标题 / 标语', '全球最大中文搜索引擎 · ARG 档案库'],
      ['notice', '顶部提示公告', '💡 提示：输入案件编号、人物姓名或案由检索线索'],
      ['placeholder', '搜索框提示词', '请输入关键词，如：陈远 或 0717'],
      ['buttonText', '搜索按钮文字', '百度一下'],
      ['notFoundText', '未搜到结果提示', '抱歉，没有找到与该关键词相关的档案记录。'],
      ['primaryColor', '主色调 / 强调色', '#174a8b'],
      ['bgColor', '页面背景色', '#f4f6f9'],
      ['cardBg', '搜索卡片背景色', '#ffffff'],
      ['textColor', '文字颜色', '#222222'],
      ['fontFamily', '字体风格', '"SimSun", "宋体", serif'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Index: {
    label: '索引页',
    templates: ['2001 门户', '档案目录', '维基档案百科'],
    fields: [
      ['siteName', '站点名称', '临江在线'],
      ['navigation', '导航文字', '首页　新闻　论坛　档案'],
      ['categoryTitle', '栏目分类标题', '最新索引 / 快捷入口'],
      ['primaryColor', '主色调 / 强调色', '#174a8b'],
      ['bgColor', '页面背景色', '#d6d6d6'],
      ['cardBg', '卡片背景色', '#ffffff'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Browse: {
    label: '浏览页',
    templates: ['2001 新闻', '复古 BBS 论坛', 'SCP 绝密卷宗', '遇害者手写日记', '极简现代杂志', '黑客数据窃密流', '监控室观察记录 (CRT)'],
    fields: [
      ['siteName', '站点名称', '临江在线'],
      ['title', '页面标题', '案件详情'],
      ['date', '日期', '2001-07-17'],
      ['author', '作者', '记者 林默'],
      ['forumName', '论坛名称', '临江论坛'],
      ['username', '用户名', '匿名用户'],
      ['time', '发帖时间', '2001-07-17 23:17'],
      ['replies', '回复内容', '暂无回复'],
      ['body', '正文', '这里是 ARG 的正文内容。\n你可以在这里放置线索、报道和故事。'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Login: {
    label: '登录页',
    templates: ['后台登录', 'BIOS 开机验证'],
    fields: [
      ['systemName', '系统名称', '档案管理后台'],
      ['password', '正确密码', '0717'],
      ['errorMessage', '密码错误提示', '❌ 密码错误，请重新输入！'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Files: {
    label: '文件页',
    templates: ['Windows 文件夹'],
    fields: [
      ['path', '文件路径', 'C:\\ARCHIVE\\0717\\'],
      ['customCss', '自定义 CSS', '']
    ]
  },
  Ending: {
    label: '结局页',
    templates: ['CRT 黑屏', '报纸头版通报', '案件结案判定书'],
    fields: [
      ['message', '结局文字', 'CASE CLOSED.\n感谢游玩。'],
      ['customCss', '自定义 CSS', '']
    ]
  },
};

export const DESKTOP_ICON_SYMBOLS = [
  { symbol: '💻', name: '我的电脑' },
  { symbol: '📁', name: '文件夹' },
  { symbol: '📄', name: '文本文档.txt' },
  { symbol: '🌐', name: 'IE 浏览器.exe' },
  { symbol: '🗑️', name: '回收站' },
  { symbol: '🔐', name: '密码保险箱' },
  { symbol: '🎵', name: '录音机.wav' },
  { symbol: '🖼️', name: '照片证据.jpg' },
  { symbol: '⚙️', name: '控制面板' },
  { symbol: '💬', name: '聊天通讯.exe' },
  { symbol: '🔍', name: '全盘搜索.exe' },
  { symbol: '💾', name: '软盘驱动器' },
  { symbol: '📧', name: '电子邮箱' },
  { symbol: '🎮', name: '经典扫雷.exe' },
  { symbol: '📟', name: '命令提示符' },
  { symbol: '🛡️', name: '安全中心' },
  { symbol: '📻', name: '加密电台' },
  { symbol: '📷', name: '监控录像' },
  { symbol: '📊', name: '案件报表.xls' },
  { symbol: '🗝️', name: '解密工具.exe' }
];

export const empty = () => ({ title: '未命名 ARG', nodes: [], edges: [], selected: null, startId: null });
export const copy = value => JSON.parse(JSON.stringify(value));

export function newNode(type, count) {
  const safeType = TYPES[type] ? type : 'Browse';
  const index = Math.max(0, count - 1);
  const col = index % 3;
  const row = Math.floor(index / 3);
  const node = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${TYPES[safeType].label} ${count}`,
    type: safeType,
    template: TYPES[safeType].templates[0],
    x: 60 + col * 230,
    y: 60 + row * 150,
    fields: {},
    rules: safeType === 'Search' ? [{ keyword: '线索', target: '' }] : [],
    contacts: []
  };
  TYPES[safeType].fields.forEach(field => {
    node.fields[field[0]] = field[2];
  });
  return node;
}
