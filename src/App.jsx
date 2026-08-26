import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { buildPageHtml } from './generator.js'
import { pageFileName, defaultContacts } from './route-config.js'
import { runtimeSource } from './runtime.js'
import { setCustomTemplates } from './templates.js'
import { getQiyuebanDemoProject } from './demo-project.js'
import { Terminal } from './Terminal.jsx'
import { validateStoryGraph } from './validator.js'
import { DshPanel } from './DshPanel.jsx'
import { EventsModal } from './EventsModal.jsx'
import { getStoredDshEndpoint, checkDshHealth } from './dsh-bridge.js'
import { executeBatchCli } from './cli.js'

const TYPES = {
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
    templates: ['2001 新闻', '复古 BBS 论坛', 'SCP 绝密卷宗', '遇害者手写日记', '极简现代杂志', '黑客数据窃密流'],
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
}

const DESKTOP_ICON_SYMBOLS = [
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
]

const TYPE_THEME_PRESETS = {
  Browse: [
    {
      id: 'news-2001',
      name: '📰 时代新闻大头条',
      desc: '经典千禧门户新闻报道排版，双栏头条，带记者署名与出版号',
      template: '2001 新闻',
      fields: {
        primaryColor: '#174a8b',
        bgColor: '#f4f6f9',
        cardBg: '#ffffff',
        textColor: '#222222',
        fontFamily: '"SimSun", "宋体", serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'bbs-thread',
      name: '🌐 复古 BBS 论坛楼层',
      desc: '千禧论坛 BBS 讨论楼层，带楼主头像、等级徽章与发帖时间',
      template: '复古 BBS 论坛',
      fields: {
        primaryColor: '#2b5a8f',
        bgColor: '#e5edf5',
        cardBg: '#ffffff',
        textColor: '#333333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'scp-document',
      name: '📁 SCP 绝密卷宗',
      desc: '军方绝密档案，【TOP SECRET】红色印章，牛皮纸背景，黑条划线遮挡',
      template: 'SCP 绝密卷宗',
      fields: {
        primaryColor: '#991b1b',
        bgColor: '#26221c',
        cardBg: '#e8e2d2',
        textColor: '#1a1815',
        fontFamily: '"KaiTi", "楷体", "SimSun", serif',
        atmosphere: 'vignette',
        typewriter: false
      }
    },
    {
      id: 'victim-diary',
      name: '📓 遇害者手写日记',
      desc: '泛黄信纸横线、胶带粘贴照片效果、手写随笔排版',
      template: '遇害者手写日记',
      fields: {
        primaryColor: '#8b2500',
        bgColor: '#2c2219',
        cardBg: '#f6eedb',
        textColor: '#2c1d11',
        fontFamily: '"KaiTi", "楷体", "STKaiti", serif',
        atmosphere: 'vignette',
        typewriter: true
      }
    },
    {
      id: 'modern-magazine',
      name: '📖 极简现代杂志',
      desc: 'Medium/Notion 杂志风，大留白、精致字体与阅读进度感',
      template: '极简现代杂志',
      fields: {
        primaryColor: '#18181b',
        bgColor: '#fafafa',
        cardBg: '#ffffff',
        textColor: '#18181b',
        fontFamily: 'Inter, -apple-system, "Noto Serif SC", serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'cyber-leak',
      name: '💻 黑客数据窃密流',
      desc: '绿荧光黑客终端数据转储流，等宽代码，解密跳码',
      template: '黑客数据窃密流',
      fields: {
        primaryColor: '#00ff66',
        bgColor: '#05070a',
        cardBg: '#0b0f19',
        textColor: '#00ff66',
        fontFamily: '"Courier New", Consolas, monospace',
        atmosphere: 'crt',
        typewriter: true
      }
    }
  ],
  Chat: [
    {
      id: 'wechat-ui',
      name: '📱 微信 UI 风格',
      desc: '现代移动微信聊天，绿色气泡在右，沉浸式标题栏',
      template: '微信 UI 风格',
      fields: {
        primaryColor: '#95ec69',
        bgColor: '#f0f2f5',
        cardBg: '#ffffff',
        textColor: '#333333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'qq-retro',
      name: '🐧 经典 QQ 2000',
      desc: 'XP 经典 QQ 聊天窗口，复古企鹅图标，微蓝对话框',
      template: '经典 QQ 风格',
      fields: {
        primaryColor: '#cce5ff',
        bgColor: '#c3daf9',
        cardBg: '#ffffff',
        textColor: '#002244',
        fontFamily: '"SimSun", "宋体", "MS Sans Serif", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'telegram-blue',
      name: '✈️ Telegram 极客蓝',
      desc: '半透明圆角悬浮气泡，蓝灰毛玻璃质感',
      template: 'Telegram 风格',
      fields: {
        primaryColor: '#3390ec',
        bgColor: '#e6ebee',
        cardBg: '#ffffff',
        textColor: '#1e293b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'discord-dark',
      name: '🎮 Discord 暗黑社区',
      desc: '深灰背景，角色身份组标签，富文本 Embed 卡片',
      template: 'Discord 社区频道',
      fields: {
        primaryColor: '#5865f2',
        bgColor: '#202225',
        cardBg: '#36393f',
        textColor: '#dcddde',
        fontFamily: '"gg sans", "Noto Sans", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'terminal-chat',
      name: '📟 暗黑加密终端',
      desc: '黑客命令行打字机，绿字光标，加密通讯信道',
      template: '暗黑加密通讯',
      fields: {
        primaryColor: '#00ff66',
        bgColor: '#080c14',
        cardBg: '#0f172a',
        textColor: '#00ff66',
        fontFamily: '"Courier New", Consolas, monospace',
        atmosphere: 'crt',
        typewriter: true
      }
    }
  ],
  Desktop: [
    {
      id: 'win98-classic',
      name: '🖥️ Windows 98 经典桌面',
      desc: '千禧灰色任务栏、开始菜单、经典复古系统图标',
      template: 'Windows 98 桌面',
      fields: {
        primaryColor: '#000080',
        bgColor: '#008080',
        cardBg: '#c0c0c0',
        textColor: '#ffffff',
        fontFamily: '"MS Sans Serif", "SimSun", "宋体", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'winxp-luna',
      name: '🏞️ Windows XP 蓝天草原',
      desc: '经典 Bliss 蓝天绿草壁纸，立体蓝色任务栏',
      template: 'Windows XP 桌面',
      fields: {
        primaryColor: '#245edb',
        bgColor: '#245edb',
        cardBg: '#ece9d8',
        textColor: '#ffffff',
        fontFamily: '"Tahoma", "Microsoft YaHei", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'macos-9',
      name: '🍏 Mac OS 9 怀旧桌面',
      desc: '复古黑白条纹菜单栏，经典 Platinum 扁平拟物',
      template: 'Mac OS 9 桌面',
      fields: {
        primaryColor: '#000080',
        bgColor: '#56728a',
        cardBg: '#e6e6e6',
        textColor: '#000000',
        fontFamily: '"Charcoal", "Geneva", "PingFang SC", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'cyber-matrix',
      name: '⚡ 赛博黑客工作站',
      desc: '深黑高科技雷达、拓扑网络背景、矩阵监控',
      template: '赛博朋克桌面',
      fields: {
        primaryColor: '#00f0ff',
        bgColor: '#05070e',
        cardBg: '#0e1626',
        textColor: '#00f0ff',
        fontFamily: '"Courier New", Consolas, monospace',
        atmosphere: 'crt',
        typewriter: false
      }
    },
    {
      id: 'investigation-dark',
      name: '🕵️ 调查员暗房工作台',
      desc: '木质暗调桌面、散落案卷与软木板图钉照片',
      template: '调查员工作台',
      fields: {
        primaryColor: '#ca8a04',
        bgColor: '#181512',
        cardBg: '#2a241e',
        textColor: '#e5e5e5',
        fontFamily: '"KaiTi", "SimSun", serif',
        atmosphere: 'vignette',
        typewriter: false
      }
    }
  ],
  Search: [
    {
      id: 'classic-search',
      name: '🔍 经典千禧搜索',
      desc: '经典居中双色 Logo，全网搜索引擎门户',
      template: '经典搜索',
      fields: {
        primaryColor: '#174a8b',
        bgColor: '#f4f6f9',
        cardBg: '#ffffff',
        textColor: '#222222',
        fontFamily: '"SimSun", "宋体", serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'terminal-search',
      name: '🌐 暗网情报终端',
      desc: '深黑黑客数据库检索终端，绿字扫描线',
      template: '终端搜索',
      fields: {
        primaryColor: '#00ff66',
        bgColor: '#05070a',
        cardBg: '#090e17',
        textColor: '#00ff66',
        fontFamily: '"Courier New", Consolas, monospace',
        atmosphere: 'crt',
        typewriter: false
      }
    },
    {
      id: 'yahoo-1999',
      name: '📚 1999 门户搜索',
      desc: '世纪末雅虎黄页式分类目录与搜索',
      template: '1999 门户搜索',
      fields: {
        primaryColor: '#cc0000',
        bgColor: '#ffffff',
        cardBg: '#ffffcc',
        textColor: '#000000',
        fontFamily: '"Times New Roman", "SimSun", serif',
        atmosphere: '',
        typewriter: false
      }
    }
  ],
  Login: [
    {
      id: 'admin',
      name: '🔐 绝密后台密码锁',
      desc: '机密安全系统管理员认证界面',
      template: '后台登录',
      fields: {
        primaryColor: '#10b981',
        bgColor: '#0f172a',
        cardBg: '#1e293b',
        textColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        atmosphere: 'vignette',
        typewriter: false
      }
    },
    {
      id: 'bios-screen',
      name: '📟 BIOS 开机自检',
      desc: '经典 Award/AMI 蓝屏硬件自检与开机口令',
      template: 'BIOS 开机验证',
      fields: {
        primaryColor: '#ffff55',
        bgColor: '#0000aa',
        cardBg: '#000000',
        textColor: '#ffffff',
        fontFamily: '"Consolas", "Courier New", monospace',
        atmosphere: 'crt',
        typewriter: true
      }
    }
  ],
  Files: [
    {
      id: 'windows-folder',
      name: '📁 Windows 资源管理器',
      desc: '复古树状文件目录，双击打开案卷',
      template: 'Windows 文件夹',
      fields: {
        primaryColor: '#000080',
        bgColor: '#ffffff',
        cardBg: '#f0f0f0',
        textColor: '#000000',
        fontFamily: '"MS Sans Serif", "SimSun", sans-serif',
        atmosphere: '',
        typewriter: false
      }
    }
  ],
  Ending: [
    {
      id: 'crt-black',
      name: '📺 CRT 显像管黑屏',
      desc: '复古显像管黑屏，缓缓打字，老电视关机光点',
      template: 'CRT 黑屏',
      fields: {
        primaryColor: '#00ff66',
        bgColor: '#000000',
        cardBg: '#000000',
        textColor: '#ffffff',
        fontFamily: '"Courier New", Consolas, monospace',
        atmosphere: 'crt',
        typewriter: true
      }
    },
    {
      id: 'newspaper-headline',
      name: '📰 报纸头版结案通报',
      desc: '黑白纪实大报头版《悬案终破》、《真相曝光》',
      template: '报纸头版通报',
      fields: {
        primaryColor: '#000000',
        bgColor: '#d4d0c8',
        cardBg: '#f5f4ef',
        textColor: '#111111',
        fontFamily: '"SimSun", "宋体", serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'final-verdict',
      name: '⚖️ 案件法庭裁决书',
      desc: '红头严肃法律文书，公文印章，涉案人员判决',
      template: '案件结案判定书',
      fields: {
        primaryColor: '#dc2626',
        bgColor: '#f1f5f9',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        fontFamily: '"KaiTi", "楷体", "SimSun", serif',
        atmosphere: '',
        typewriter: false
      }
    }
  ],
  Index: [
    {
      id: 'portal-2001',
      name: '🌐 2001 千禧门户',
      desc: '千禧时代新闻与栏目分类导航索引',
      template: '2001 门户',
      fields: {
        primaryColor: '#174a8b',
        bgColor: '#d6d6d6',
        cardBg: '#ffffff',
        textColor: '#222222',
        fontFamily: '"SimSun", "宋体", serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'archive-directory',
      name: '📂 档案分类目录',
      desc: '严谨的案卷索引目录，带物证标签',
      template: '档案目录',
      fields: {
        primaryColor: '#0284c7',
        bgColor: '#f8fafc',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        atmosphere: '',
        typewriter: false
      }
    },
    {
      id: 'wiki-archive',
      name: '📚 维基档案百科',
      desc: '百科词条风格，带目录索引与词条跳转',
      template: '维基档案百科',
      fields: {
        primaryColor: '#3366cc',
        bgColor: '#ffffff',
        cardBg: '#f8f9fa',
        textColor: '#202122',
        fontFamily: 'sans-serif',
        atmosphere: '',
        typewriter: false
      }
    }
  ]
}

const empty = () => ({ title: '未命名 ARG', nodes: [], edges: [], selected: null, startId: null })
const copy = value => JSON.parse(JSON.stringify(value))

function newNode(type, count) {
  const safeType = TYPES[type] ? type : 'Browse'
  const index = Math.max(0, count - 1)
  const col = index % 3
  const row = Math.floor(index / 3)
  const node = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${TYPES[safeType].label} ${count}`,
    type: safeType,
    template: TYPES[safeType].templates[0],
    x: 60 + col * 230,
    y: 60 + row * 150,
    fields: {},
    rules: safeType === 'Search' ? [{ keyword: '线索', target: '' }] : [],
    contacts: safeType === 'Chat' ? defaultContacts() : []
  }
  TYPES[safeType].fields.forEach(field => {
    node.fields[field[0]] = field[2]
  })
  return node
}


export default function App() {
  const [state, setState] = useState(() => {
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem('arg-blueprint-react') || 'null')
    } catch (e) {
      saved = null
    }
    if (!saved || !Array.isArray(saved.nodes) || saved.nodes.length === 0) {
      saved = getQiyuebanDemoProject()
    }
    if (!saved.customTemplates) {
      try {
        saved.customTemplates = JSON.parse(localStorage.getItem('arg_custom_templates') || '[]')
      } catch (e) {
        saved.customTemplates = []
      }
    }
    setCustomTemplates(saved.customTemplates)
    saved.nodes = (saved.nodes || []).filter(Boolean)
    saved.edges = (saved.edges || []).filter(Boolean)
    saved.nodes.forEach((node, index) => {
      if (typeof node.x !== 'number' || isNaN(node.x)) node.x = 60 + (index % 3) * 230
      if (typeof node.y !== 'number' || isNaN(node.y)) node.y = 60 + Math.floor(index / 3) * 150
      if (!node.type || !TYPES[node.type]) node.type = 'Browse'
      if (!node.fields) node.fields = {}
    })
    if (saved.nodes.length && !saved.startId) saved.startId = saved.nodes[0].id
    if (saved.nodes.length && !saved.nodes.some(node => node.isStart)) saved.nodes[0].isStart = true
    return saved
  })
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [panning, setPanning] = useState(null)
  const [drag, setDrag] = useState(null)
  const [connect, setConnect] = useState(null)
  const [previewNode, setPreviewNode] = useState(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showValidatorModal, setShowValidatorModal] = useState(false)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [showDshPanel, setShowDshPanel] = useState(false)
  const [dshOnline, setDshOnline] = useState(false)
  const [dshEndpoint, setDshEndpoint] = useState(getStoredDshEndpoint())
  const [history, setHistory] = useState({ past: [], future: [] })
  const [terminalOpen, setTerminalOpen] = useState(false)
  const canvas = useRef(null)
  const importInputRef = useRef(null)
  const selected = state.nodes.find(node => node.id === state.selected)

  const graphValidation = useMemo(() => validateStoryGraph(state), [state])

  const update = (fn, { recordHistory = true } = {}) => {
    setState(current => {
      const next = copy(current)
      fn(next)
      if (recordHistory) {
        setHistory(h => ({
          past: [...h.past.slice(-30), copy(current)],
          future: []
        }))
      }
      localStorage.setItem('arg-blueprint-react', JSON.stringify(next))
      if (next.customTemplates) {
        localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
        setCustomTemplates(next.customTemplates)
      }
      return next
    })
  }

  const undo = () => {
    if (!history.past.length) return
    const prev = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    setHistory(h => ({
      past: newPast,
      future: [copy(state), ...h.future.slice(0, 30)]
    }))
    setState(prev)
    localStorage.setItem('arg-blueprint-react', JSON.stringify(prev))
    if (prev.customTemplates) {
      setCustomTemplates(prev.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(prev.customTemplates))
    }
  }

  const redo = () => {
    if (!history.future.length) return
    const next = history.future[0]
    const newFuture = history.future.slice(1)
    setHistory(h => ({
      past: [...h.past.slice(-30), copy(state)],
      future: newFuture
    }))
    setState(next)
    localStorage.setItem('arg-blueprint-react', JSON.stringify(next))
    if (next.customTemplates) {
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    }
  }

  const selectNode = id => {
    update(next => { next.selected = id }, { recordHistory: false })
    setInspectorOpen(true)
  }

  const focusNode = (nodeId) => {
    const node = state.nodes.find(n => n.id === nodeId)
    if (node) {
      selectNode(node.id)
      setViewport({ x: -node.x + 200, y: -node.y + 150, zoom: 1 })
      setShowValidatorModal(false)
    }
  }

  const add = type => {
    update(next => {
      const node = newNode(type, next.nodes.length + 1)
      next.nodes.push(node)
      if (!next.startId || !next.nodes.some(n => n.id === next.startId)) {
        next.startId = node.id
        node.isStart = true
      }
      next.selected = node.id
    })
    setShowAddMenu(false)
    setInspectorOpen(true)
  }

  const setAsStart = (id, e) => {
    if (e) e.stopPropagation()
    update(next => {
      next.startId = id
      next.nodes.forEach(n => { n.isStart = n.id === id })
    })
  }

  const remove = () => selected && update(next => {
    next.nodes = next.nodes.filter(node => node.id !== selected.id)
    next.edges = next.edges.filter(edge => edge.from !== selected.id && edge.to !== selected.id)
    if (next.startId === selected.id) { next.startId = next.nodes[0]?.id || null; next.nodes.forEach((node, index) => { node.isStart = index === 0 }) }
    next.selected = next.nodes[0]?.id || null
  })

  const patchSelected = fn => selected && update(next => fn(next.nodes.find(node => node.id === selected.id)))

  const editSlots = (id, slots) => update(next => {
    const node = next.nodes.find(item => item.id === id)
    if (node) Object.assign(node.fields, slots)
  })

  // Periodic DSH Health Probe
  useEffect(() => {
    const checkConn = async () => {
      const ep = getStoredDshEndpoint()
      setDshEndpoint(ep)
      const res = await checkDshHealth(ep)
      setDshOnline(res.online)
    }
    checkConn()
    const timer = setInterval(checkConn, 10000)
    return () => clearInterval(timer)
  }, [])

  // Listen for incoming DSH scripts via postMessage
  useEffect(() => {
    const handleDshMessage = (event) => {
      if (event.data && event.data.type === 'ARG_EXECUTE_SCRIPT' && typeof event.data.script === 'string') {
        const out = executeBatchCli(event.data.script, state, update)
        console.log('[DSH Bridge] Executed script from DSH:', out)
      }
    }
    window.addEventListener('message', handleDshMessage)
    return () => window.removeEventListener('message', handleDshMessage)
  }, [state])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        setTerminalOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  const handleImportFile = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const loadedState = await parseAndLoadProject(file)
      setHistory(h => ({ past: [...h.past.slice(-30), copy(state)], future: [] }))
      setState(loadedState)
      setCustomTemplates(loadedState.customTemplates)
      localStorage.setItem('arg-blueprint-react', JSON.stringify(loadedState))
      localStorage.setItem('arg_custom_templates', JSON.stringify(loadedState.customTemplates))
      if (loadedState.nodes.length) {
        const minX = Math.min(...loadedState.nodes.map(n => n.x))
        const minY = Math.min(...loadedState.nodes.map(n => n.y))
        setViewport({ x: -minX + 80, y: -minY + 60, zoom: 1 })
      }
      alert(`成功导入项目「${loadedState.title}」！\n已恢复 ${loadedState.nodes.length} 个页面节点、${loadedState.edges.length} 条连线关系。`)
    } catch (err) {
      console.error('Import failed:', err)
      alert('导入失败: ' + err.message)
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    const handleKeyDown = event => {
      const target = event.target
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.closest('.modal')
      
      // Ctrl+Z / Cmd+Z: Undo
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        if (!isInput) {
          event.preventDefault()
          undo()
        }
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y: Redo
      else if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z') || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')) {
        if (!isInput) {
          event.preventDefault()
          redo()
        }
      }
      // Delete or Backspace to delete selected node
      else if ((event.key === 'Delete' || event.key === 'Backspace') && !isInput) {
        if (state.selected) {
          event.preventDefault()
          remove()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, history])

  useEffect(() => {
    localStorage.setItem('arg-blueprint-react', JSON.stringify(state))
    if (state.customTemplates) {
      localStorage.setItem('arg_custom_templates', JSON.stringify(state.customTemplates))
      setCustomTemplates(state.customTemplates)
    }
  }, [state])

  useEffect(() => {
    const move = event => {
      if (panning) {
        const dx = event.clientX - panning.mouseX
        const dy = event.clientY - panning.mouseY
        setViewport(v => ({ ...v, x: panning.startX + dx, y: panning.startY + dy }))
        return
      }
      if (drag && canvas.current) {
        const rect = canvas.current.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        const worldX = (mouseX - viewport.x) / viewport.zoom
        const worldY = (mouseY - viewport.y) / viewport.zoom
        update(next => {
          const node = next.nodes.find(item => item.id === drag.id)
          if (!node) return
          node.x = Math.round(worldX - drag.dx)
          node.y = Math.round(worldY - drag.dy)
        }, { recordHistory: false })
      }
    }
    const up = event => {
      if (panning) setPanning(null)
      if (connect) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.map-node')?.dataset.id
        if (target && target !== connect) update(next => {
          next.edges = next.edges.filter(edge => !(edge.from === connect && edge.to === target))
          const targetNode = next.nodes.find(node => node.id === target)
          next.edges.push({ from: connect, to: target, port: targetNode?.name || target, label: targetNode?.name || '访问页面', desc: '' })
        })
        setConnect(null)
      }
      setDrag(null)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [drag, connect, panning, viewport])

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const handleWheel = event => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92
      setViewport(v => {
        const newZoom = Math.min(2.5, Math.max(0.4, Number((v.zoom * zoomFactor).toFixed(2))))
        const newX = Math.round(mouseX - (mouseX - v.x) * (newZoom / v.zoom))
        const newY = Math.round(mouseY - (mouseY - v.y) * (newZoom / v.zoom))
        return { x: newX, y: newY, zoom: newZoom }
      })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const workspaceClass = `workspace ${sidebarOpen && inspectorOpen ? 'with-both' : (sidebarOpen ? 'sidebar-only' : (inspectorOpen ? 'inspector-only' : 'zen-mode'))}`

  return <>
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="ghost icon-tiny"
          style={{ fontSize: 12, padding: '4px 8px' }}
          title={sidebarOpen ? '收起左侧页面列表' : '展开左侧页面列表'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '«' : '» 页面列表'}
        </button>
        <div className="brand">
          <span className="brand-mark">■</span>
          <div className="brand-title-wrap">
            <strong>ARG Blueprint</strong>
            <input
              className="project-title-input"
              value={state.title || '未命名 ARG 剧情'}
              onChange={e => update(next => { next.title = e.target.value })}
              title="点击重命名项目"
              placeholder="项目名称..."
            />
          </div>
        </div>
      </div>
      <div className="topbar-toolbar">
        <button className="ghost icon-tiny" style={{ padding: '5px 8px' }} disabled={!history.past.length} onClick={undo} title="撤销上一步操作 (Ctrl+Z)">
          撤销
        </button>
        <button className="ghost icon-tiny" style={{ padding: '5px 8px' }} disabled={!history.future.length} onClick={redo} title="重做操作 (Ctrl+Y 或 Ctrl+Shift+Z)">
          重做
        </button>
        <button
          className="ghost icon-tiny"
          style={{ color: terminalOpen ? 'var(--text-main)' : 'inherit', fontWeight: terminalOpen ? 600 : 'normal' }}
          onClick={() => setTerminalOpen(!terminalOpen)}
          title="打开/收起 Linux 命令行终端 (快捷键 Ctrl+`)"
        >
          终端
        </button>
        <input type="file" ref={importInputRef} accept=".zip,.json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button className="ghost icon-tiny" onClick={() => importInputRef.current?.click()} title="导入 .zip 或 .json 蓝图文件">导入</button>
        <button
          className="ghost icon-tiny"
          style={{ padding: '5px 8px' }}
          onClick={() => setShowEventsModal(true)}
          title="全局自定义事件、线索收集与解锁前置条件中枢"
        >
          🔒 事件线索
        </button>
        <button
          className="ghost icon-tiny"
          style={{
            padding: '5px 8px',
            color: graphValidation.healthy ? 'inherit' : '#b45309',
            fontWeight: graphValidation.healthy ? 'normal' : 600,
            borderColor: graphValidation.healthy ? 'var(--border-color)' : '#fde68a',
            background: graphValidation.healthy ? 'transparent' : '#fefce8'
          }}
          onClick={() => setShowValidatorModal(true)}
          title="剧情死胡同、孤岛与断路结局自检"
        >
          自检 {graphValidation.healthy ? '✓' : `(${graphValidation.errorCount + graphValidation.warningCount})`}
        </button>
        <button
          className="ghost icon-tiny"
          style={{
            padding: '5px 8px',
            color: dshOnline ? '#166534' : 'inherit',
            fontWeight: dshOnline ? 600 : 'normal',
            borderColor: dshOnline ? '#bbf7d0' : 'var(--border-color)',
            background: dshOnline ? '#f0fdf4' : 'transparent'
          }}
          onClick={() => setShowDshPanel(true)}
          title={`DeepSeek Harness (dsh) 本地协同 - 端点: ${dshEndpoint}`}
        >
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: dshOnline ? '#16a34a' : '#a1a1aa', marginRight: 4 }} />
          DSH 联动 {dshOnline ? '3080' : ''}
        </button>
        <button className="ghost icon-tiny" onClick={() => setShowTemplateModal(true)}>自定义模板</button>
        <button className="ghost icon-tiny" onClick={() => confirm('确定新建项目？') && update(next => { Object.assign(next, empty()) })}>新建</button>
        <button className="secondary" onClick={() => openPreviewInNewTab(state)} title="在新的浏览器标签页中全屏运行并体验完整游戏（支持点击桌面图标、论坛、搜索与所有结局跳转）">
          预览运行
        </button>
        <button className="primary" onClick={() => exportZip(state)} title="打包所有 HTML 与蓝图数据导出为 ZIP 压缩包">导出 ZIP</button>
        <button className="ghost icon-tiny" style={{ padding: '5px 8px', fontSize: 12 }} onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏模式'}>
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
    </header>

    <main className={workspaceClass}>
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="panel-title">页面节点 ({state.nodes.length})</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="primary icon-tiny" onClick={() => setShowAddMenu(!showAddMenu)}>
                新建
              </button>
            </div>
            {showAddMenu && (
              <div className="add-menu-popover" style={{ position: 'absolute', top: 38, left: 130, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, boxShadow: 'var(--shadow-lg)', zIndex: 30, padding: 4, minWidth: 130 }}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <div key={k} className="add-menu-item" style={{ padding: '6px 8px', fontSize: 11.5, cursor: 'pointer', borderRadius: 4, color: 'var(--text-main)' }} onClick={() => add(k)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {v.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="node-list">
            {state.nodes.map(node => (
              <div
                key={node.id}
                className={`node-item ${node.id === state.selected ? 'active' : ''}`}
                onClick={() => selectNode(node.id)}
              >
                <span className="node-dot"/>
                <div className="node-name">
                  {node.name}
                  <span className="node-type">{TYPES[node.type]?.label || node.type}{node.isStart ? ' · 起始' : ''}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="sidebar-tip">
            拖拽节点调整布局，从节点右侧圆点拖拽至目标卡片建立连线。
          </div>
        </aside>
      )}

      <section className="canvas-wrap">
        {!sidebarOpen && (
          <button className="floating-panel-toggle left" onClick={() => setSidebarOpen(true)} title="展开页面列表">
            页面列表 ({state.nodes.length})
          </button>
        )}
        {!inspectorOpen && (
          <button className="floating-panel-toggle right" onClick={() => setInspectorOpen(true)} title="展开属性配置面板">
            属性配置
          </button>
        )}

        <div
          className={`canvas ${panning ? 'panning' : ''}`}
          ref={canvas}
          style={{
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            cursor: panning ? 'grabbing' : (drag ? 'move' : 'grab')
          }}
          onMouseDown={event => {
            if (event.target.closest('.map-node') || event.target.closest('.canvas-dock-controls') || event.target.closest('.floating-panel-toggle') || event.target.closest('.empty button')) return
            setPanning({
              startX: viewport.x,
              startY: viewport.y,
              mouseX: event.clientX,
              mouseY: event.clientY
            })
          }}
        >
          <div
            className="canvas-viewport"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          >
            <svg className="edges" style={{ pointerEvents: 'none' }}>
              <defs>
                <marker id="arrow-glow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#71717a" />
                </marker>
              </defs>
              {state.edges.map((edge, index) => {
                const from = state.nodes.find(node => node.id === edge.from)
                const to = state.nodes.find(node => node.id === edge.to)
                if (!from || !to) return null
                const x1 = from.x + 200
                const y1 = from.y + 40
                const x2 = to.x
                const y2 = to.y + 40
                const dx = Math.max(60, Math.abs(x2 - x1) * 0.5)
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${index}`}
                    className="edge"
                    markerEnd="url(#arrow-glow)"
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                  />
                )
              })}
            </svg>

            {state.nodes.map(node => {
              const nodeHasIssue = graphValidation.issues.some(i => i.nodeId === node.id)
              return (
                <div
                  key={node.id}
                  data-id={node.id}
                  className={`map-node ${node.id === state.selected ? 'selected' : ''} ${node.isStart ? 'start-node' : ''} ${nodeHasIssue ? 'has-issue' : ''}`}
                  style={{ left: node.x, top: node.y, pointerEvents: 'auto' }}
                  onClick={() => selectNode(node.id)}
                  onDoubleClick={() => setPreviewNode(node)}
                onMouseDown={event => {
                  if (event.target.classList.contains('port') || event.target.closest('button')) return
                  event.stopPropagation()
                  const rect = canvas.current.getBoundingClientRect()
                  const mouseX = event.clientX - rect.left
                  const mouseY = event.clientY - rect.top
                  const worldX = (mouseX - viewport.x) / viewport.zoom
                  const worldY = (mouseY - viewport.y) / viewport.zoom
                  setDrag({
                    id: node.id,
                    dx: worldX - node.x,
                    dy: worldY - node.y
                  })
                }}
              >
                <div className="node-header-row">
                  <span className={`badge ${node.type}`}>{TYPES[node.type]?.label || node.type}</span>
                  <span className="node-template-tag">{node.template || '默认'}</span>
                </div>
                <h3 className="node-title" title={node.name}>{node.name}</h3>
                <div className="node-desc">{summary(node, state.edges)}</div>
                
                <div className="node-actions">
                  {!node.isStart && (
                    <button className="ghost icon-tiny" title="设为起始游戏页" onClick={e => setAsStart(node.id, e)}>
                      设为起始
                    </button>
                  )}
                  <button className="ghost icon-tiny" title="实时预览该页面" onClick={e => { e.stopPropagation(); setPreviewNode(node) }}>
                    预览
                  </button>
                </div>

                {node.type !== 'Ending' && (
                  <span
                    className="port"
                    title="拖拽到目标卡片连线"
                    onMouseDown={event => { event.stopPropagation(); setConnect(node.id) }}
                  />
                )}
              </div>
            )})}
          </div>

          {!state.nodes.length && (
            <div className="empty" style={{ zIndex: 4, maxWidth: 360 }}>
              <div className="empty-icon" style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 8 }}>■</div>
              <h2>欢迎使用 ARG Blueprint</h2>
              <p style={{ marginBottom: 14 }}>从创建一个核心剧情页面节点开始：</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <button key={k} className="primary icon-tiny" onClick={() => add(k)}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="canvas-hint-bar">
            Ctrl+Z 撤销 · Ctrl+Y 重做 · Del 删除 · 拖拽右侧圆点连线 · 双击卡片快速预览
          </div>

          <div className="canvas-dock-controls">
            <button className="ghost canvas-dock-btn" disabled={!history.past.length} onClick={undo} title="撤销 (Ctrl+Z)">撤销</button>
            <button className="ghost canvas-dock-btn" disabled={!history.future.length} onClick={redo} title="重做 (Ctrl+Y)">重做</button>
            <button className="ghost canvas-dock-btn" title="放大" onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2.5, Number((v.zoom + 0.15).toFixed(2))) }))}>＋</button>
            <button className="ghost canvas-dock-btn" title="重置为 100%" onClick={() => setViewport(v => ({ ...v, zoom: 1 }))}>{Math.round(viewport.zoom * 100)}%</button>
            <button className="ghost canvas-dock-btn" title="缩小" onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.4, Number((v.zoom - 0.15).toFixed(2))) }))}>－</button>
            <button className="ghost canvas-dock-btn" title="居中聚焦所有节点" onClick={() => {
              if (!state.nodes.length) { setViewport({ x: 0, y: 0, zoom: 1 }); return }
              const minX = Math.min(...state.nodes.map(n => n.x))
              const minY = Math.min(...state.nodes.map(n => n.y))
              setViewport({ x: -minX + 80, y: -minY + 60, zoom: 1 })
            }}>居中</button>
            <button className="ghost canvas-dock-btn" title="打开 Linux 命令行终端 (Ctrl+`)" onClick={() => setTerminalOpen(!terminalOpen)}>
              终端
            </button>
            <button className="ghost canvas-dock-btn" title={isFullscreen ? '退出全屏' : '全屏模式'} onClick={toggleFullscreen}>
              {isFullscreen ? '退出全屏' : '全屏'}
            </button>
          </div>
        </div>
      </section>

      {inspectorOpen && (
        <Inspector
          selected={selected}
          nodes={state.nodes}
          edges={state.edges}
          customTemplates={state.customTemplates}
          openTemplateModal={() => setShowTemplateModal(true)}
          onClose={() => setInspectorOpen(false)}
          update={update}
          patch={patchSelected}
          remove={remove}
          addRule={() => patchSelected(node => { node.rules = node.rules || []; node.rules.push({ keyword: '新关键词', target: state.nodes.find(item => item.id !== node.id)?.id || '' }) })}
          addNode={add}
        />
      )}
    </main>

    <Terminal state={state} update={update} isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
    {showValidatorModal && (
      <ValidatorModal
        validation={graphValidation}
        onFocusNode={focusNode}
        onClose={() => setShowValidatorModal(false)}
      />
    )}
    {showEventsModal && (
      <EventsModal
        state={state}
        onClose={() => setShowEventsModal(false)}
        onFocusNode={focusNode}
      />
    )}
    {showDshPanel && (
      <DshPanel
        state={state}
        update={update}
        isOpen={showDshPanel}
        onClose={() => setShowDshPanel(false)}
      />
    )}
    {previewNode && <Preview state={state} initialNode={previewNode} onEdit={editSlots} close={() => setPreviewNode(null)}/>} 
    {showTemplateModal && (
      <CustomTemplateModal
        state={state}
        update={update}
        close={() => setShowTemplateModal(false)}
        initialType={selected?.type || 'Browse'}
        onSelectTemplate={name => patchSelected(node => { node.template = name })}
      />
    )} 
  </>
}

function summary(node, edges = []) {
  if (node.type === 'Chat') {
    const count = (node.contacts || defaultContacts()).length
    return `联系人 ${count} 位 · 对话分支`
  }
  if (node.type === 'Desktop') {
    const count = edges.filter(e => e.from === node.id).length
    return `桌面图标 ${count} 个`
  }
  if (node.type === 'Search') {
    const rulesCount = (node.rules || []).length
    const btnCount = edges.filter(e => e.from === node.id).length
    return `规则 ${rulesCount} 条 · 按键 ${btnCount} 个`
  }
  if (node.type === 'Login') return `密码验证 · ${node.fields?.password ? '已设置' : '未设置'}`
  if (node.type === 'Index') {
    const count = edges.filter(e => e.from === node.id).length
    return `超链接按键 ${count} 个`
  }
  return node.fields?.title || node.fields?.siteName || node.fields?.path || node.fields?.message || '未填写内容'
}


function Inspector({ selected, nodes, edges, customTemplates = [], openTemplateModal, onClose, update, patch, remove, addRule, addNode }) {
  const [activeTab, setActiveTab] = useState('content') // 'content' | 'links' | 'style'

  if (!selected) return (
    <aside className="inspector">
      <div className="inspector-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>属性配置</h2>
        </div>
        {onClose && <button className="icon-btn" onClick={onClose} title="收起属性面板">»</button>}
      </div>
      <div className="inspector-empty">
        <p style={{ marginBottom: 16 }}>在流程图中选择节点开始编辑，<br/>或快速创建新页面：</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 6px' }}>
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} className="ghost" style={{ textAlign: 'left', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => addNode && addNode(k)}>
              <span>＋ {v.label}</span>
              <span style={{ fontSize: 11, color: '#a0aec0' }}>{k}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )

  const isChat = selected.type === 'Chat'
  const isSearch = selected.type === 'Search'
  const isIndex = selected.type === 'Index'
  const isDesktop = selected.type === 'Desktop'

  const currentPresets = TYPE_THEME_PRESETS[selected.type] || []

  const applyPreset = preset => {
    patch(node => {
      if (preset.template) {
        node.template = preset.template
      }
      if (preset.fields) {
        Object.entries(preset.fields).forEach(([k, v]) => {
          node.fields[k] = v
        })
      }
    })
  }

  const customForThisType = (customTemplates || []).filter(t => t.type === selected.type || t.type === 'Custom')

  return <aside className="inspector">
    <div className="inspector-head">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>{selected.name}</h2>
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose} title="收起属性面板" style={{ fontSize: 14, padding: '2px 6px' }}>
            »
          </button>
        )}
      </div>
      <div className="inspector-tabs">
        <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
          {isChat ? '基础信息' : '内容与规则'}
        </button>
        <button className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
          {isChat ? '联系人与对话' : (isDesktop ? '桌面图标' : '连接出口')}
        </button>
        <button className={`tab-btn ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>
          样式定制
        </button>
      </div>
    </div>
    <div className="inspector-body">
      {activeTab === 'content' && <>
        <Field label="页面名称"><input value={selected.name} onChange={event => patch(node => { node.name = event.target.value })}/></Field>
        <Field label="页面类型">
          <select value={selected.type} onChange={event => patch(node => {
            node.type = event.target.value
            node.template = TYPES[node.type].templates[0]
            node.fields = {}
            TYPES[node.type].fields.forEach(field => { node.fields[field[0]] = field[2] })
            if (node.type === 'Chat' && (!node.contacts || !node.contacts.length)) {
              node.contacts = defaultContacts()
            }
          })}>
            {Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </Field>
        <Field label="HTML 模板">
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ flex: 1 }} value={selected.template} onChange={event => patch(node => { node.template = event.target.value })}>
              <optgroup label="内置官方预设">
                {TYPES[selected.type].templates.map(template => <option key={template} value={template}>{template}</option>)}
              </optgroup>
              {customForThisType.length > 0 && (
                <optgroup label="自定义导入模板">
                  {customForThisType.map(t => <option key={t.name} value={t.name}>{t.name} (自定义)</option>)}
                </optgroup>
              )}
            </select>
            <button className="ghost icon-tiny" style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }} title="上传/管理自定义模板" onClick={openTemplateModal}>
              导入
            </button>
          </div>
        </Field>

        {TYPES[selected.type].fields.filter(f => !['primaryColor','bgColor','cardBg','textColor','fontFamily','customCss'].includes(f[0])).map(field => {
          const fieldKey = field[0]
          const fieldLabel = field[1]

          // Specific element deletion for stickyNote in Desktop
          if (fieldKey === 'stickyNote') {
            const isNoteDeleted = selected.fields.showStickyNote === false || selected.fields.stickyNote === '__deleted__' || !selected.fields.stickyNote
            return (
              <div key="stickyNote" className="field" style={{ margin: '10px 0' }}>
                {!isNoteDeleted ? (
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>桌面便签卡片 (Sticky Note)</label>
                      <button
                        className="rule-remove"
                        style={{ color: '#71717a', fontSize: 11, padding: '1px 5px', borderRadius: 3 }}
                        title="删除便签"
                        onClick={() => patch(node => { node.fields.showStickyNote = false; node.fields.stickyNote = '__deleted__' })}
                      >
                        删除
                      </button>
                    </div>
                    <textarea
                      style={{ background: '#fff', border: '1px solid var(--border-color)', fontSize: 11.5, minHeight: 60 }}
                      value={selected.fields.stickyNote === '__deleted__' ? '' : (selected.fields.stickyNote || '')}
                      onChange={event => patch(node => { node.fields.stickyNote = event.target.value; node.fields.showStickyNote = true; })}
                    />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 6, padding: '8px 10px', textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>桌面便签已隐藏</span>
                    <button
                      className="primary icon-tiny"
                      style={{ marginLeft: 8, fontSize: 10.5, padding: '2px 6px' }}
                      onClick={() => patch(node => { node.fields.showStickyNote = true; node.fields.stickyNote = '案件调查备忘：\n1. 查阅 0717 卷宗。\n2. 登录档案库后台核对嫌疑人名单。'; })}
                    >
                      恢复便签
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Specific element deletion for notice in Search
          if (fieldKey === 'notice') {
            const isNoticeDeleted = selected.fields.showNotice === false || selected.fields.notice === '__deleted__' || !selected.fields.notice
            return (
              <div key="notice" className="field" style={{ margin: '10px 0' }}>
                {!isNoticeDeleted ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>顶部提示公告 (Notice)</label>
                      <button
                        className="rule-remove"
                        style={{ color: '#71717a', fontSize: 11, padding: '1px 5px' }}
                        title="删除公告"
                        onClick={() => patch(node => { node.fields.showNotice = false; node.fields.notice = '__deleted__' })}
                      >
                        删除
                      </button>
                    </div>
                    <textarea
                      value={selected.fields.notice === '__deleted__' ? '' : (selected.fields.notice || '')}
                      onChange={event => patch(node => { node.fields.notice = event.target.value; node.fields.showNotice = true; })}
                    />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 6, padding: '8px 10px', textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>顶部公告已删除</span>
                    <button
                      className="primary icon-tiny"
                      style={{ marginLeft: 8, fontSize: 10.5, padding: '2px 6px' }}
                      onClick={() => patch(node => { node.fields.showNotice = true; node.fields.notice = '提示：输入案件编号、人物姓名或案由检索线索'; })}
                    >
                      恢复公告
                    </button>
                  </div>
                )}
              </div>
            )
          }

          return (
            <Field key={fieldKey} label={fieldLabel}>
              {fieldKey === 'body' || fieldKey === 'message' || fieldKey === 'replies' ? (
                <textarea value={selected.fields[fieldKey] || ''} onChange={event => patch(node => { node.fields[fieldKey] = event.target.value })}/>
              ) : (
                <input value={selected.fields[fieldKey] || ''} onChange={event => patch(node => { node.fields[fieldKey] = event.target.value })}/>
              )}
            </Field>
          )
        })}
        {isSearch && <div className="field">
          <label>关键词检索规则</label>
          {(selected.rules || []).map((rule, index) => <div className="rule" key={index}>
            <button className="rule-remove" onClick={() => patch(node => { node.rules.splice(index, 1) })}>×</button>
            <div className="rule-row">
              <input placeholder="搜索关键词" value={rule.keyword} onChange={event => patch(node => { node.rules[index].keyword = event.target.value })}/>
              <select value={rule.target} onChange={event => patch(node => { node.rules[index].target = event.target.value })}>
                {nodes.filter(node => node.id !== selected.id).map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
              </select>
            </div>
          </div>)}
          <button className="ghost" style={{ width: '100%' }} onClick={addRule}>添加关键词规则</button>
        </div>}
      </>}

      {activeTab === 'links' && (
        isChat ? (
          <ChatEditor selected={selected} nodes={nodes} edges={edges} update={update} patch={patch}/>
        ) : (
          <LinkEditor selected={selected} nodes={nodes} edges={edges} update={update}/>
        )
      )}

      {activeTab === 'style' && <>
        <div className="field" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
              🎨 {TYPES[selected.type]?.label || selected.type} 专属 UI 主题预设 ({currentPresets.length})
            </label>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>一键切换完整 UI 结构与质感</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {currentPresets.map((preset) => {
              const isCurrent = selected.template === preset.template
              return (
                <button
                  key={preset.id}
                  type="button"
                  className="ghost"
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: 6,
                    border: isCurrent ? '2px solid #2563eb' : '1px solid var(--border-color)',
                    background: isCurrent ? 'var(--bg-subtle)' : '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => applyPreset(preset)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <strong style={{ fontSize: 12, color: isCurrent ? '#2563eb' : 'var(--text-main)' }}>
                      {preset.name} {isCurrent ? '✓' : ''}
                    </strong>
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: isCurrent ? '#dbeafe' : '#f1f5f9', color: isCurrent ? '#1e40af' : '#64748b' }}>
                      {preset.template}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {preset.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label>{isChat ? '玩家气泡强调色 (Bubble Color)' : '主色调 / 强调色 (Primary Color)'}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={selected.fields.primaryColor || (isChat ? '#95ec69' : '#174a8b')} onChange={e => patch(node => { node.fields.primaryColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.primaryColor || (isChat ? '#95ec69' : '#174a8b')} onChange={e => patch(node => { node.fields.primaryColor = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>页面背景色 (Background Color)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={selected.fields.bgColor || (isChat ? '#f0f2f5' : '#f4f6f9')} onChange={e => patch(node => { node.fields.bgColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.bgColor || (isChat ? '#f0f2f5' : '#f4f6f9')} onChange={e => patch(node => { node.fields.bgColor = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>{isChat ? '聊天主窗口背景色' : '卡片容器背景色'}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={selected.fields.cardBg || '#ffffff'} onChange={e => patch(node => { node.fields.cardBg = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.cardBg || '#ffffff'} onChange={e => patch(node => { node.fields.cardBg = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>文字主色 (Text Color)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={selected.fields.textColor || '#222222'} onChange={e => patch(node => { node.fields.textColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.textColor || '#222222'} onChange={e => patch(node => { node.fields.textColor = e.target.value })}/>
          </div>
        </div>

        <Field label="字体风格">
          <select value={selected.fields.fontFamily || (isChat ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif' : '"SimSun", "宋体", serif')} onChange={e => patch(node => { node.fields.fontFamily = e.target.value })}>
            <option value='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif'>微信现代界面 (System UI / YaHei)</option>
            <option value='"SimSun", "宋体", serif'>宋体 / 报刊复古 (SimSun)</option>
            <option value='"KaiTi", "楷体", serif'>楷体 / 严肃公文 (KaiTi)</option>
            <option value='"Courier New", "Consolas", monospace'>黑客终端 / 等宽打字机 (Monospace)</option>
          </select>
        </Field>

        <Field label="氛围多媒体滤镜 (Atmosphere Filter)">
          <select value={selected.fields.atmosphere || ''} onChange={e => patch(node => { node.fields.atmosphere = e.target.value })}>
            <option value="">默认 (无滤镜)</option>
            <option value="crt">CRT 复古显像管扫描线</option>
            <option value="vignette">暗角暗影 (悬疑/绝密档案)</option>
            <option value="glitch">画面微弱故障闪烁 (Glitch)</option>
          </select>
        </Field>

        <div className="field" style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5 }}>
            <input
              type="checkbox"
              style={{ width: 'auto', cursor: 'pointer' }}
              checked={Boolean(selected.fields.typewriter)}
              onChange={e => patch(node => { node.fields.typewriter = e.target.checked })}
            />
            <span>启用打字机逐字排字动效 (支持点击/空格瞬间跳过)</span>
          </label>
        </div>

        <ImageUpload
          label="自定义壁纸 / 页面背景图 (覆盖默认纯色背景)"
          value={selected.fields.bgImage}
          onChange={val => patch(node => { node.fields.bgImage = val })}
          size={44}
          placeholder="上传本地壁纸图片文件或粘贴 URL..."
        />

        <Field label="自定义 CSS (WordPress 级样式注入)">
          <textarea
            placeholder={`/* 可直接书写 CSS 覆写样式，例如：*/\n.msg-bubble { border-radius: 12px; }\n.chat-sidebar { background: #e0e7ff; }`}
            style={{ minHeight: 110, fontFamily: 'monospace', fontSize: 12 }}
            value={selected.fields.customCss || ''}
            onChange={e => patch(node => { node.fields.customCss = e.target.value })}
          />
        </Field>
      </>}

      <button className="danger" style={{ marginTop: 24 }} onClick={remove}>删除这个页面</button>
    </div>
  </aside>
}

function ImageUpload({ value, onChange, label, placeholder = '上传图片或输入 URL', size = 36, shape = 'square' }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      onChange(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const isImage = typeof value === 'string' && (
    value.startsWith('data:image/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('blob:') ||
    ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'].some(ext => value.split('?')[0].toLowerCase().endsWith(ext))
  )

  return (
    <div className="image-upload-widget" style={{ marginTop: 6, marginBottom: 8 }}>
      {label && <label style={{ fontSize: 10, display: 'block', marginBottom: 3, fontWeight: 'bold', color: '#4a5568' }}>{label}</label>}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {isImage ? (
          <div style={{
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? '50%' : 4,
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            background: '#f1f5f9',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? '50%' : 4,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.5
          }}>
            {value || '🖼️'}
          </div>
        )}
        <input
          style={{ flex: 1, fontSize: 12, padding: '5px 8px' }}
          placeholder={placeholder}
          value={isImage ? value : ''}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,.ico"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="ghost"
          style={{ fontSize: 11, padding: '5px 8px', whiteSpace: 'nowrap' }}
          onClick={() => fileInputRef.current?.click()}
          title="上传本地图片（自动转为 Base64 嵌入）"
        >
          📁 上传
        </button>
        {isImage && (
          <button
            type="button"
            className="rule-remove"
            style={{ fontSize: 12 }}
            onClick={() => onChange('')}
            title="清除图片"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}


function ChatEditor({ selected, nodes, edges, update, patch }) {
  const contacts = selected.contacts && selected.contacts.length ? selected.contacts : defaultContacts()
  const [activeContactId, setActiveContactId] = useState(contacts[0]?.id || '')
  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0]
  const contactIdx = Math.max(0, contacts.findIndex(c => c.id === activeContact?.id))

  const AVATARS = ['👮', '🕵️', '👤', '👩', '👨', '👴', '🤖', '🐱', '🕶️', '📁', '💻', '🔐']

  const updateContacts = (newContacts) => {
    patch(node => {
      node.contacts = newContacts
    })
  }

  const addContact = () => {
    const newId = `c_${Date.now()}`
    const newC = {
      id: newId,
      name: `新联系人 ${contacts.length + 1}`,
      avatar: '👤',
      bio: '新身份简介',
      lastMsg: '点击开始对话',
      unread: true,
      dialogue: [
        { id: `m_${Date.now()}_1`, sender: 'npc', text: '你好，我是新联系人。有重要线索提供。' },
        {
          id: `m_${Date.now()}_2`,
          sender: 'choice',
          options: [
            { text: '发生什么事了？', reply: '线索已经记录在案，请查阅相关档案！', target: '' }
          ]
        }
      ]
    }
    const next = [...contacts, newC]
    updateContacts(next)
    setActiveContactId(newId)
  }

  const removeContact = (id) => {
    if (contacts.length <= 1) {
      alert('至少保留一位联系人')
      return
    }
    const next = contacts.filter(c => c.id !== id)
    updateContacts(next)
    setActiveContactId(next[0].id)
  }

  const updateActiveContact = (fn) => {
    const next = JSON.parse(JSON.stringify(contacts))
    fn(next[contactIdx])
    updateContacts(next)
  }

  const addDialogueItem = (sender) => {
    updateActiveContact(c => {
      c.dialogue = c.dialogue || []
      if (sender === 'npc') {
        c.dialogue.push({ id: `m_${Date.now()}`, sender: 'npc', text: '请输入 NPC 回复内容...' })
      } else if (sender === 'choice') {
        c.dialogue.push({
          id: `m_${Date.now()}`,
          sender: 'choice',
          options: [
            { text: '选项 A：查问线索', reply: 'NPC：这是相关档案线索。', target: '' }
          ]
        })
      }
    })
  }

  const moveDialogueItem = (dIdx, delta) => {
    updateActiveContact(c => {
      const targetIdx = dIdx + delta
      if (targetIdx < 0 || targetIdx >= c.dialogue.length) return
      const temp = c.dialogue[dIdx]
      c.dialogue[dIdx] = c.dialogue[targetIdx]
      c.dialogue[targetIdx] = temp
    })
  }

  const removeDialogueItem = (dIdx) => {
    updateActiveContact(c => {
      c.dialogue.splice(dIdx, 1)
    })
  }

  const addChoiceOption = (dIdx) => {
    updateActiveContact(c => {
      const step = c.dialogue[dIdx]
      if (step && step.options) {
        step.options.push({ text: `新选项 ${step.options.length + 1}`, reply: 'NPC 的回应内容...', target: '' })
      }
    })
  }

  const removeChoiceOption = (dIdx, optIdx) => {
    updateActiveContact(c => {
      const step = c.dialogue[dIdx]
      if (step && step.options && step.options.length > 1) {
        step.options.splice(optIdx, 1)
      } else {
        alert('每个分支至少保留 1 个选项')
      }
    })
  }

  const targets = nodes.filter(n => n.id !== selected.id)

  return (
    <div className="chat-editor-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ margin: 0, fontWeight: 'bold' }}>联系人列表 ({contacts.length})</label>
        <button className="ghost icon-tiny" style={{ fontSize: 12, padding: '4px 8px' }} onClick={addContact}>＋ 添加联系人</button>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {contacts.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ghost"
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: (c.id === (activeContact?.id || '')) ? '2px solid #07c160' : '1px solid #dfe5ec',
              background: (c.id === (activeContact?.id || '')) ? '#e8f7ed' : '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveContactId(c.id)}
          >
            <span>{c.avatar || '👤'}</span>
            <strong>{c.name}</strong>
          </button>
        ))}
      </div>

      {activeContact && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 'bold', color: '#07c160' }}>👤 当前编辑联系人：{activeContact.name}</span>
            {contacts.length > 1 && (
              <button className="rule-remove" title="删除此联系人" onClick={() => removeContact(activeContact.id)}>×</button>
            )}
          </div>

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>联系人姓名</label>
            <input
              value={activeContact.name}
              onChange={e => updateActiveContact(c => { c.name = e.target.value })}
            />
          </div>

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>选择头像 Emoji</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
              {AVATARS.map(em => (
                <button
                  key={em}
                  type="button"
                  className="ghost"
                  style={{
                    fontSize: 14,
                    padding: '3px 6px',
                    border: (activeContact.avatar || '👤') === em ? '1px solid #07c160' : '1px solid #dfe5ec',
                    background: (activeContact.avatar || '👤') === em ? '#e8f7ed' : '#fff'
                  }}
                  onClick={() => updateActiveContact(c => { c.avatar = em })}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <ImageUpload
            label="或上传自定义联系人头像图片 (PNG/JPG/GIF/WebP)"
            value={activeContact.avatar}
            onChange={val => updateActiveContact(c => { c.avatar = val || '👤' })}
            shape="circle"
            size={38}
            placeholder="上传头像图片或输入 URL..."
          />

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>身份头衔 / 个性签名</label>
            <input
              placeholder="例如：临江市刑侦支队 0717专案组"
              value={activeContact.bio || ''}
              onChange={e => updateActiveContact(c => { c.bio = e.target.value })}
            />
          </div>

          <div style={{ marginTop: 14, borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ margin: 0, fontSize: 11, fontWeight: 'bold' }}>💬 对话脚本与选项序列</label>
            </div>

            {(activeContact.dialogue || []).map((step, dIdx) => (
              <div className="rule link-card" key={step.id || dIdx} style={{ marginBottom: 10, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button className="ghost icon-tiny" disabled={dIdx === 0} onClick={() => moveDialogueItem(dIdx, -1)}>↑</button>
                    <button className="ghost icon-tiny" disabled={dIdx === (activeContact.dialogue.length - 1)} onClick={() => moveDialogueItem(dIdx, 1)}>↓</button>
                    <strong style={{ fontSize: 11, color: step.sender === 'npc' ? '#2563eb' : '#059669', marginLeft: 4 }}>
                      {step.sender === 'npc' ? `NPC 消息 #${dIdx + 1}` : `玩家选项分支 #${dIdx + 1}`}
                    </strong>
                  </div>
                  <button className="rule-remove" onClick={() => removeDialogueItem(dIdx)}>×</button>
                </div>

                {step.sender === 'npc' ? (
                  <div className="field" style={{ margin: '4px 0 0 0' }}>
                    <label style={{ fontSize: 10 }}>NPC 消息内容</label>
                    <textarea
                      placeholder="输入 NPC 发送的内容..."
                      style={{ minHeight: 48, fontSize: 12 }}
                      value={step.text || ''}
                      onChange={e => updateActiveContact(c => { c.dialogue[dIdx].text = e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 10, color: '#059669', fontWeight: 'bold' }}>玩家在聊天框可点击的回复选项：</label>
                    {(step.options || []).map((opt, optIdx) => (
                      <div key={optIdx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: 6, margin: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 'bold', color: '#166534' }}>选项 {String.fromCharCode(65 + optIdx)}</span>
                          {step.options.length > 1 && (
                            <button className="rule-remove" style={{ fontSize: 11 }} onClick={() => removeChoiceOption(dIdx, optIdx)}>×</button>
                          )}
                        </div>
                        <div className="field" style={{ margin: '2px 0 4px 0' }}>
                          <label style={{ fontSize: 9 }}>玩家选项文字 (点击发送)</label>
                          <input
                            placeholder="例如：0717 案卷在你手上吗？"
                            value={opt.text}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].text = e.target.value })}
                          />
                        </div>
                        <div className="field" style={{ margin: '2px 0 4px 0' }}>
                          <label style={{ fontSize: 9 }}>NPC 紧接着的回应内容</label>
                          <input
                            placeholder="例如：在城西仓库，快去查看！"
                            value={opt.reply || ''}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].reply = e.target.value })}
                          />
                        </div>
                        <div className="field" style={{ margin: '2px 0 0 0' }}>
                          <label style={{ fontSize: 9 }}>关联跳转页面 (可选)</label>
                          <select
                            value={opt.target || ''}
                            onChange={e => {
                              const targetVal = e.target.value
                              updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].target = targetVal })
                              if (targetVal) {
                                update(next => {
                                  if (!next.edges.some(edge => edge.from === selected.id && edge.to === targetVal)) {
                                    const targetNode = next.nodes.find(n => n.id === targetVal)
                                    next.edges.push({
                                      from: selected.id,
                                      to: targetVal,
                                      port: targetVal,
                                      label: opt.text || targetNode?.name || '聊天分支',
                                      desc: '聊天对话触发'
                                    })
                                  }
                                })
                              }
                            }}
                          >
                            <option value="">（不跳转，仅对话）</option>
                            {targets.map(n => <option key={n.id} value={n.id}>{n.name}（{TYPES[n.type]?.label || n.type}）</option>)}
                          </select>
                        </div>
                        <div className="field" style={{ margin: '4px 0 0 0' }}>
                          <label style={{ fontSize: 9, color: opt.requires ? '#b45309' : 'inherit', fontWeight: opt.requires ? 600 : 'normal' }}>
                            🔒 解锁前置线索/页面 (可选)
                          </label>
                          <select
                            value={opt.requires || ''}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].requires = e.target.value })}
                          >
                            <option value="">（无前置条件 · 开局即可见）</option>
                            {nodes.filter(n => n.id !== selected.id).map(n => (
                              <option key={n.id} value={n.id}>需先探索：{n.name} ({n.id})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button className="ghost icon-tiny" style={{ width: '100%', fontSize: 11, marginTop: 4 }} onClick={() => addChoiceOption(dIdx)}>＋ 增加选项分支</button>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => addDialogueItem('npc')}>添加 NPC 消息</button>
              <button className="ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => addDialogueItem('choice')}>添加玩家选项分支</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function LinkEditor({ selected, nodes, edges, update }) {
  const outgoing = edges.filter(edge => edge.from === selected.id)
  const targets = nodes.filter(node => node.id !== selected.id)
  const isSearch = selected.type === 'Search'
  const isIndex = selected.type === 'Index'
  const isDesktop = selected.type === 'Desktop'

  const addLink = (placement = 'hot', defaultIcon = '📁') => {
    const target = targets.find(node => !outgoing.some(edge => edge.to === node.id)) || targets[0]
    if (target) {
      update(next => next.edges.push({
        from: selected.id,
        to: target.id,
        port: target.name,
        label: target.name,
        desc: isSearch ? '热搜推荐' : (target.fields?.title || ''),
        placement: isSearch ? placement : 'default',
        icon: isDesktop ? defaultIcon : ''
      }))
    } else {
      alert('请先创建其他页面节点作为超链接目标')
    }
  }

  const moveLink = (index, delta) => {
    const targetIndex = index + delta
    if (targetIndex < 0 || targetIndex >= outgoing.length) return
    update(next => {
      const edgeA = outgoing[index]
      const edgeB = outgoing[targetIndex]
      const realIndexA = next.edges.indexOf(edgeA)
      const realIndexB = next.edges.indexOf(edgeB)
      if (realIndexA !== -1 && realIndexB !== -1) {
        const temp = next.edges[realIndexA]
        next.edges[realIndexA] = next.edges[realIndexB]
        next.edges[realIndexB] = temp
      }
    })
  }

  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ margin: 0 }}>{isDesktop ? '桌面图标列表 / 快捷方式' : '超链接按键列表 / 页面出口'}</label>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{outgoing.length} 个{isDesktop ? '图标' : '出口'}</span>
      </div>
      <button className="ghost start-toggle" style={{ marginBottom: 10, width: '100%' }} onClick={() => update(next => { next.startId = selected.id; next.nodes.forEach(node => { node.isStart = node.id === selected.id }) })}>
        {selected.isStart ? '当前为游戏起始页' : '设为游戏起始页'}
      </button>
      
      {isDesktop && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          桌面图标设定：所有图标将以网格形式呈现在 Windows 桌面上，点击即可打开对应页面。
        </div>
      )}

      {isSearch && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          搜索页按键设定：可自由添加顶部导航按键或热门检索通道。
        </div>
      )}

      {isIndex && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          索引页将自动把下列按键渲染在页面的超链接列表中，点击即可跳转。
        </div>
      )}

      {outgoing.map((edge, index) => {
        const target = nodes.find(node => node.id === edge.to)
        const realIdx = edges.indexOf(edge)
        const isIconImg = typeof edge.icon === 'string' && (edge.icon.startsWith('data:image/') || edge.icon.startsWith('http://') || edge.icon.startsWith('https://') || edge.icon.startsWith('/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'].some(ext => edge.icon.split('?')[0].toLowerCase().endsWith(ext)))
        return (
          <div className="rule link-card" key={`${edge.from}-${edge.to}-${index}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="ghost icon-tiny" title="上移" disabled={index === 0} onClick={() => moveLink(index, -1)}>↑</button>
                <button className="ghost icon-tiny" title="下移" disabled={index === outgoing.length - 1} onClick={() => moveLink(index, 1)}>↓</button>
                {isDesktop && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'var(--bg-subtle)', borderRadius: 3, border: '1px solid var(--border-color)' }}>
                    {isIconImg ? <img src={edge.icon} alt="ico" style={{ width: 16, height: 16, objectFit: 'contain' }} /> : (edge.icon || '📁')}
                  </span>
                )}
                <strong style={{ fontSize: 11.5, color: 'var(--text-main)', alignSelf: 'center' }}>
                  {isDesktop ? `桌面图标 #${index + 1}` : `按键 #${index + 1}`}
                </strong>
              </div>
              <button className="rule-remove" title="删除该项目" onClick={() => update(next => { next.edges.splice(realIdx, 1) })}>×</button>
            </div>
            
            {isDesktop && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>选择预设图标图案 (或在下方上传自定义图片)</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                  {DESKTOP_ICON_SYMBOLS.map(item => (
                    <button
                      key={item.symbol}
                      type="button"
                      className="ghost"
                      style={{
                        fontSize: 11,
                        padding: '3px 6px',
                        border: (edge.icon || '📁') === item.symbol ? '1px solid #356ae6' : '1px solid #dfe5ec',
                        background: (edge.icon || '📁') === item.symbol ? '#eef3ff' : '#fff',
                        fontWeight: (edge.icon || '📁') === item.symbol ? 'bold' : 'normal'
                      }}
                      title={item.name}
                      onClick={() => update(next => {
                        const itemEdge = next.edges[realIdx]
                        if (itemEdge) {
                          itemEdge.icon = item.symbol
                          if (!itemEdge.port || itemEdge.port === target?.name || itemEdge.port === '我的电脑' || itemEdge.port === '文件夹') {
                            itemEdge.port = item.name
                            itemEdge.label = item.name
                          }
                        }
                      })}
                    >
                      {item.symbol} {item.name}
                    </button>
                  ))}
                </div>

                <ImageUpload
                  label="或上传自定义桌面图标图片 (.ico/.png/.jpg/WebP)"
                  value={edge.icon}
                  onChange={val => update(next => {
                    const itemEdge = next.edges[realIdx]
                    if (itemEdge) itemEdge.icon = val || '📁'
                  })}
                  size={34}
                  placeholder="上传本地图标图片或输入 URL..."
                />
              </div>
            )}

            <div className="field" style={{ margin: '4px 0 6px 0' }}>
              <label style={{ fontSize: 10, fontWeight: 'bold' }}>{isDesktop ? '🖥️ 自定义软件名称 / 桌面文件名' : '按键显示文字 / 链接名称'}</label>
              <input
                placeholder={isDesktop ? '例如：我的电脑、案件卷宗_0717.txt、网际快车.exe' : '例如：新闻、贴吧 或 🔥 7·17案'}
                value={edge.port || target?.name || edge.to}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) {
                    item.port = event.target.value
                    item.label = event.target.value
                  }
                })}
              />
            </div>

            {isSearch && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>按键显示位置</label>
                <select
                  value={edge.placement || 'hot'}
                  onChange={event => update(next => {
                    const item = next.edges[realIdx]
                    if (item) item.placement = event.target.value
                  })}
                >
                  <option value="hot">🔥 搜索框下方 · 热门检索 / 快捷推荐</option>
                  <option value="nav">🧭 页面右上角 · 顶部导航按键</option>
                </select>
              </div>
            )}

            {isIndex && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>副标题 / 补充描述（可选）</label>
                <input
                  placeholder="例如：HOT 或 2001-07-17"
                  value={edge.desc || ''}
                  onChange={event => update(next => {
                    const item = next.edges[realIdx]
                    if (item) item.desc = event.target.value
                  })}
                />
              </div>
            )}

            <div className="field" style={{ margin: '4px 0 0 0' }}>
              <label style={{ fontSize: 10 }}>双击/点击打开的目标页面</label>
              <select
                value={edge.to}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) item.to = event.target.value
                })}
              >
                {targets.map(node => <option key={node.id} value={node.id}>{node.name}（{TYPES[node.type]?.label || node.type}）</option>)}
              </select>
            </div>

            <div className="field" style={{ margin: '4px 0 0 0' }}>
              <label style={{ fontSize: 10, color: edge.requires ? '#b45309' : 'inherit', fontWeight: edge.requires ? 600 : 'normal' }}>
                🔒 解锁前置线索/页面 (可选)
              </label>
              <select
                value={edge.requires || ''}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) item.requires = event.target.value
                })}
              >
                <option value="">（无前置条件 · 开局即可见）</option>
                {nodes.filter(node => node.id !== selected.id).map(node => (
                  <option key={node.id} value={node.id}>需先探索：{node.name} ({node.id})</option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {isDesktop ? (
          <button className="ghost" style={{ width: '100%', fontSize: 12 }} onClick={() => addLink('default', '📁')}>＋ 添加桌面图标</button>
        ) : isSearch ? (
          <>
            <button className="ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => addLink('hot')}>＋ 热门推荐按键</button>
            <button className="ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => addLink('nav')}>＋ 顶部导航按键</button>
          </>
        ) : (
          <button className="ghost" style={{ width: '100%' }} onClick={() => addLink('default')}>＋ 添加超链接按键</button>
        )}
      </div>
    </div>
  )
}



const Field = ({ label, children }) => <div className="field"><label>{label}</label>{children}</div>

function Preview({ state, close, initialNode, onEdit }) {
  const [id, setId] = useState(initialNode?.id || state.startId || state.nodes[0]?.id)
  const [linkPort, setLinkPort] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const frame = useRef(null)
  const node = state.nodes.find(item => item.id === id || item.name === id || pageFileName(state, item.id) === id) || state.nodes.find(item => item.id === state.startId) || state.nodes[0]
  const outgoing = state.edges.filter(edge => edge.from === node?.id)
  const portName = edge => edge.port || state.nodes.find(item => item.id === edge.to)?.name || edge.to
  const prepare = () => frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => { element.contentEditable = 'true'; element.classList.add('arg-editable') })
  const format = command => { frame.current?.contentDocument?.execCommand(command, false, null); frame.current?.contentWindow.focus() }
  const linkSelection = () => {
    const doc = frame.current?.contentDocument
    const selection = doc?.getSelection()
    if (!doc || !selection || selection.rangeCount === 0 || selection.isCollapsed || !linkPort) return
    if (linkPort === '__unlink__') doc.execCommand('unlink', false, null)
    else {
      doc.execCommand('createLink', false, '#')
      const anchor = selection.anchorNode?.parentElement?.closest('a')
      if (anchor) {
        anchor.removeAttribute('href')
        anchor.dataset.argLink = linkPort
      }
    }
    frame.current?.contentWindow.focus()
  }
  const saveSlots = () => {
    const slots = {}
    frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => { slots[element.dataset.argSlot] = element.innerHTML })
    onEdit(node.id, slots)
  }
  useEffect(() => {
    const onMessage = event => {
      if (event.data?.type === 'arg-route') {
        const target = event.data.target
        const matched = state.nodes.find(n => n.id === target || n.name === target || pageFileName(state, n.id) === target)
        if (matched) setId(matched.id)
        else setId(target)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [state])
  useEffect(() => setLinkPort(''), [id])
  if (!node) return null
  return <div className="modal">
    <div className={`modal-card ${isMaximized ? 'fullscreen' : ''}`}>
      <div className="modal-head">
        <div><span className="eyebrow">HTML PREVIEW</span><h2>实时页面预览 · {node.name}</h2></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="ghost icon-tiny" style={{ fontSize: 12, padding: '3px 8px' }} onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? '恢复窗口大小' : '最大化铺满窗口'}>
            {isMaximized ? '🗗 还原' : '⛶ 展开大屏'}
          </button>
          <button className="icon-btn" onClick={close} title="关闭预览">×</button>
        </div>
      </div>
      <div className="preview-bar">
        <span>{pageFileName(state, node.id)}</span>
        <span className="preview-live">LIVE · 模板实时渲染（支持点击按键体验跳转）</span>
      </div>
      <div className="editor-toolbar">
        <button className="ghost" onClick={() => format('bold')}><strong>B</strong> 加粗</button>
        <button className="ghost" onClick={() => format('italic')}><em>I</em> 斜体</button>
        <select className="link-target" value={linkPort} onChange={event => setLinkPort(event.target.value)}>
          <option value="">选择链接目标</option>
          {outgoing.map((edge, index) => <option key={`${edge.to}-${index}`} value={portName(edge)}>{portName(edge)}</option>)}
          <option value="__unlink__">删除选中的超链接</option>
        </select>
        <button className="ghost" onClick={linkSelection} disabled={!linkPort}>{linkPort === '__unlink__' ? '取消链接' : '🔗 设为链接'}</button>
        <button className="primary" onClick={saveSlots}>保存内容</button>
        <span>直接编辑页面文字或点击按键预览跳转</span>
      </div>
      <iframe ref={frame} onLoad={prepare} title="ARG 游戏预览" srcDoc={buildPageHtml(node, state, { preview: true })}/>
    </div>
  </div>
}

export function openPreviewInNewTab(state, initialNode) {
  if (!state.nodes || !state.nodes.length) {
    alert('画布上暂无页面节点，请先添加页面或载入官方范例！')
    return
  }
  const startNode = initialNode || state.nodes.find(n => n.id === state.startId) || state.nodes[0]
  const pages = {}
  state.nodes.forEach(node => {
    const html = buildPageHtml(node, state, { preview: true })
    pages[node.id] = html
    const fileName = pageFileName(state, node.id)
    pages[fileName] = html
    if (node.name) pages[node.name] = html
  })

  const pagesJsonSafe = JSON.stringify(pages).replace(/</g, '\\u003c')
  const nodesJsonSafe = JSON.stringify(state.nodes.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type,
    file: pageFileName(state, n.id)
  }))).replace(/</g, '\\u003c')
  const edgesJsonSafe = JSON.stringify(state.edges || []).replace(/</g, '\\u003c')
  const rawNodesJsonSafe = JSON.stringify(state.nodes).replace(/</g, '\\u003c')

  const runnerHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARG 游戏独立运行器 · ${state.title || 'ARG'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif; }
    #arg-preview-frame { width: 100vw; height: 100vh; border: none; display: block; background: #fff; }
    .runner-floating-bar {
      position: fixed;
      top: 12px;
      right: 16px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      padding: 6px 12px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      color: #fff;
      font-size: 12px;
      user-select: none;
      transition: all 0.25s ease;
    }
    .runner-floating-bar.collapsed {
      padding: 6px 10px;
      background: rgba(15, 23, 42, 0.6);
      opacity: 0.6;
    }
    .runner-floating-bar.collapsed:hover {
      opacity: 1;
      background: rgba(15, 23, 42, 0.9);
    }
    .runner-pill-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      padding: 4px 9px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: background 0.15s, transform 0.1s;
    }
    .runner-pill-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .runner-pill-btn:active {
      transform: scale(0.96);
    }
    .runner-select {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      outline: none;
      max-width: 150px;
      cursor: pointer;
    }
    .runner-select option {
      background: #1e293b;
      color: #fff;
    }
  </style>
</head>
<body>
  <div id="runnerBar" class="runner-floating-bar">
    <span style="color:#fafafa; font-weight:600; cursor:pointer;" onclick="toggleCollapse()" title="点击收起/展开控制条">ARG 运行器</span>
    <span id="pageTitle" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.9;"></span>
    <select id="nodeSelect" class="runner-select" onchange="loadPage(this.value)">
    </select>
    <button class="runner-pill-btn" onclick="restartGame()" title="重新从起始页开始">重开</button>
    <button class="runner-pill-btn" onclick="toggleFullscreen()" title="全屏体验">全屏</button>
    <button class="runner-pill-btn" onclick="toggleCollapse()" title="收起控制条" id="collapseBtn">◀</button>
  </div>
  <iframe id="arg-preview-frame" title="ARG Runtime Game Player"></iframe>

  <script type="application/json" id="arg-pages-data">${pagesJsonSafe}</script>
  <script type="application/json" id="arg-nodes-data">${nodesJsonSafe}</script>
  <script type="application/json" id="arg-edges-data">${edgesJsonSafe}</script>
  <script type="application/json" id="arg-raw-nodes-data">${rawNodesJsonSafe}</script>

  <script>
    const PAGES = JSON.parse(document.getElementById('arg-pages-data').textContent);
    const NODES = JSON.parse(document.getElementById('arg-nodes-data').textContent);
    const EDGES = JSON.parse(document.getElementById('arg-edges-data').textContent);
    const RAW_NODES = JSON.parse(document.getElementById('arg-raw-nodes-data').textContent);
    const START_ID = ${JSON.stringify(state.startId || state.nodes[0]?.id)};
    let currentId = ${JSON.stringify(startNode.id)};
    let isCollapsed = false;

    const frame = document.getElementById('arg-preview-frame');
    const pageTitle = document.getElementById('pageTitle');
    const nodeSelect = document.getElementById('nodeSelect');
    const runnerBar = document.getElementById('runnerBar');
    const collapseBtn = document.getElementById('collapseBtn');

    NODES.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = n.name;
      nodeSelect.appendChild(opt);
    });

    function resolveTarget(fromNodeId, key) {
      if (!key) return null;
      const raw = String(key).trim();

      // 1. Direct hit in PAGES
      if (PAGES[raw]) return raw;

      // 2. Direct hit in NODES (id, name, file)
      const node = NODES.find(n => n.id === raw || n.name === raw || n.file === raw);
      if (node && PAGES[node.id]) return node.id;

      // 3. Search in EDGES (port, label, to) from current page first
      if (fromNodeId) {
        const currentEdges = EDGES.filter(e => e.from === fromNodeId);
        const edgeInCurrent = currentEdges.find(e => e.port === raw || e.label === raw || e.to === raw);
        if (edgeInCurrent && (PAGES[edgeInCurrent.to] || NODES.some(n => n.id === edgeInCurrent.to))) {
          return edgeInCurrent.to;
        }
      }
      const anyEdge = EDGES.find(e => e.port === raw || e.label === raw || e.to === raw);
      if (anyEdge && (PAGES[anyEdge.to] || NODES.some(n => n.id === anyEdge.to))) {
        return anyEdge.to;
      }

      // 4. Search in RULES (keyword -> target)
      for (const n of RAW_NODES) {
        if (n.type === 'Search' && n.rules) {
          const r = n.rules.find(rule => rule.keyword && rule.keyword.trim().toLowerCase() === raw.toLowerCase());
          if (r && (PAGES[r.target] || NODES.some(item => item.id === r.target))) return r.target;
        }
      }

      // 5. Search in Contacts (choice text -> target)
      for (const n of RAW_NODES) {
        if (n.type === 'Chat' && n.contacts) {
          for (const c of n.contacts) {
            const opt = (c.choices || []).find(o => o.text === raw || o.target === raw);
            if (opt && opt.target && (PAGES[opt.target] || NODES.some(item => item.id === opt.target))) {
              return opt.target;
            }
          }
        }
      }

      // 6. Match by .html filename
      const withHtml = raw.endsWith('.html') ? raw : raw + '.html';
      if (PAGES[withHtml]) return withHtml;

      return raw;
    }

    function loadPage(idOrPortOrName) {
      if (!idOrPortOrName) return;
      const targetId = resolveTarget(currentId, idOrPortOrName);
      const html = PAGES[targetId] || PAGES[idOrPortOrName];
      if (html) {
        currentId = targetId;
        frame.srcdoc = html;
        const nodeInfo = NODES.find(n => n.id === targetId || n.name === targetId || n.file === targetId);
        const name = nodeInfo ? nodeInfo.name : targetId;
        pageTitle.textContent = name;
        nodeSelect.value = nodeInfo ? nodeInfo.id : targetId;
        document.title = name + ' · ARG 游戏独立运行器';
      } else {
        console.warn('Target page not found in preview cache:', idOrPortOrName, '-> resolved:', targetId);
        frame.srcdoc = '<div style="padding:60px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;color:#333;background:#f8fafc;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
          '<div style="font-size:48px;margin-bottom:16px;">🔍</div>' +
          '<h2 style="margin-bottom:8px;font-size:20px;color:#1e293b;">未找到目标页面</h2>' +
          '<p style="color:#64748b;font-size:14px;max-width:400px;line-height:1.6;margin-bottom:20px;">' +
            '请求的跳转目标 <code>' + String(idOrPortOrName) + '</code> 尚未关联到有效的页面节点。' +
          '</p>' +
          '<button style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;" onclick="window.parent.postMessage({type:\\'arg-route\\', target:\\'' + START_ID + '\\'}, \\'*\\')">返回起始桌面</button>' +
        '</div>';
      }
    }

    function restartGame() {
      loadPage(START_ID);
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
      } else {
        document.exitFullscreen().catch(e => console.log(e));
      }
    }

    function toggleCollapse() {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        runnerBar.classList.add('collapsed');
        pageTitle.style.display = 'none';
        nodeSelect.style.display = 'none';
        collapseBtn.textContent = '▶';
      } else {
        runnerBar.classList.remove('collapsed');
        pageTitle.style.display = 'inline';
        nodeSelect.style.display = 'inline';
        collapseBtn.textContent = '◀';
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'arg-route') {
        loadPage(event.data.target);
      }
    });

    frame.addEventListener('load', function() {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        doc.addEventListener('click', function(e) {
          const el = e.target && e.target.closest ? e.target.closest('[data-arg-link], [data-arg-port]') : null;
          if (el) {
            e.preventDefault();
            e.stopPropagation();
            const port = el.dataset.argLink || el.dataset.argPort;
            if (port) loadPage(port);
          }
        }, true);

        doc.addEventListener('submit', function(e) {
          const form = e.target;
          if (form && (form.dataset.argComponent === 'login' || form.querySelector('input[type="password"]'))) {
            e.preventDefault();
            e.stopPropagation();
            const input = form.querySelector('input[type="password"], input');
            const val = (input ? input.value : '').trim().toLowerCase();
            if (val === 'yxzyddx' || val === '0717' || val === '一切自愿的大学') {
              loadPage('node_files');
            }
          }
        }, true);
      } catch (err) {}
    });

    // Initial load
    loadPage(currentId);
  </script>
</body>
</html>`

  const blob = new Blob([runnerHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const newWin = window.open(url, '_blank')
  if (!newWin) {
    alert('浏览器拦截了新窗口，请在地址栏允许打开新标签页！')
  }
}

export async function exportZip(state) {
  try {
    const zip = new JSZip()
    
    // 1. Add arg-runtime.js
    zip.file('arg-runtime.js', runtimeSource)

    // 2. Add all HTML pages
    state.nodes.forEach(node => {
      const filename = pageFileName(state, node.id)
      const htmlContent = buildPageHtml(node, state)
      zip.file(filename, htmlContent)
    })

    // 3. Add arg-blueprint.json (so full graph, coordinates, rules, contacts, and custom templates can be restored)
    const projectData = {
      version: '1.0.0',
      title: state.title || '未命名 ARG',
      startId: state.startId,
      nodes: state.nodes,
      edges: state.edges,
      customTemplates: state.customTemplates || [],
      exportedAt: new Date().toISOString()
    }
    zip.file('arg-blueprint.json', JSON.stringify(projectData, null, 2))

    // 4. Generate zip blob and trigger download
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeTitle = (state.title || 'arg-game').replace(/[\\/:*?"<>|]/g, '_')
    link.download = `${safeTitle}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  } catch (err) {
    console.error('Export ZIP error:', err)
    alert('导出 ZIP 失败: ' + err.message)
  }
}

export async function parseAndLoadProject(file) {
  let projectData = null

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    const jsonFile = zip.file('arg-blueprint.json') || zip.file('blueprint.json') || Object.values(zip.files).find(f => f.name.endsWith('.json'))
    if (jsonFile) {
      const text = await jsonFile.async('text')
      projectData = JSON.parse(text)
    } else {
      throw new Error('未在 ZIP 压缩包中找到 arg-blueprint.json 蓝图元数据文件')
    }
  } else if (file.name.endsWith('.json')) {
    const text = await file.text()
    projectData = JSON.parse(text)
  } else {
    throw new Error('仅支持导入 .zip 压缩包或 .json 蓝图文件')
  }

  if (!projectData || !Array.isArray(projectData.nodes)) {
    throw new Error('蓝图数据格式不正确：缺少 nodes 页面节点列表')
  }

  const sanitizedNodes = projectData.nodes.map((node, index) => {
    const type = TYPES[node.type] ? node.type : 'Browse'
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      id: node.id || `n_${Date.now()}_${index}`,
      name: node.name || `${TYPES[type]?.label || type} ${index + 1}`,
      type,
      template: node.template || TYPES[type].templates[0],
      x: (typeof node.x === 'number' && !isNaN(node.x)) ? node.x : (60 + col * 230),
      y: (typeof node.y === 'number' && !isNaN(node.y)) ? node.y : (60 + row * 150),
      fields: node.fields || {},
      rules: Array.isArray(node.rules) ? node.rules : (type === 'Search' ? [{ keyword: '线索', target: '' }] : []),
      contacts: Array.isArray(node.contacts) ? node.contacts : (type === 'Chat' ? defaultContacts() : []),
      isStart: Boolean(node.isStart)
    }
  })

  const sanitizedEdges = Array.isArray(projectData.edges) ? projectData.edges : []
  const customTemplates = Array.isArray(projectData.customTemplates) ? projectData.customTemplates : []

  let startId = projectData.startId
  if (!startId || !sanitizedNodes.some(n => n.id === startId)) {
    startId = sanitizedNodes[0]?.id || null
  }
  sanitizedNodes.forEach((node, idx) => {
    node.isStart = node.id === startId || (!startId && idx === 0)
  })

  return {
    title: projectData.title || '已导入 ARG 蓝图',
    startId,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
    customTemplates,
    selected: sanitizedNodes[0]?.id || null
  }
}

export function buildAIPrompt({
  pageType = 'Browse 浏览页 / 档案页',
  style = '泛黄绝密档案卷宗 / 红色印章 / 打印机打字机排版',
  era = '1998年临江市刑侦专案组',
  purpose = '受害者加密日记 / 警方通报 / 案件线索记录',
  content = '案发时间、目击证词、嫌疑人画像与密码线索',
  specialEffect = '档案泛黄折痕、红色绝密印章、涂黑机密打码',
  reference = 'SCP基金会、临江仙、模拟犯罪档案'
} = {}) {
  return `你是 ARG Blueprint 的网页模板设计助手。

你的任务：
根据创作者的想法，生成一个可以导入 ARG Blueprint 的网页模板。

用户需求：

页面类型：
${pageType || '{PAGE_TYPE}'}

页面风格：
${style || '{STYLE}'}

时代背景：
${era || '{ERA}'}

页面用途：
${purpose || '{PURPOSE}'}

页面内容：
${content || '{CONTENT}'}

特殊效果：
${specialEffect || '{SPECIAL_EFFECT}'}

参考作品：
${reference || '{REFERENCE}'}


---

请注意：

你不是在制作完整网站。

你是在制作 ARG Blueprint 的一个页面模板。

这个模板只负责：

- 页面视觉效果
- 内容展示
- 用户交互入口


所有以下功能由 ARG Blueprint Runtime 控制：

- 页面跳转
- 剧情条件
- 密码验证
- 搜索判断
- 玩家状态
- 存档


---

必须遵守 ARG Blueprint 模板规范。


## HTML要求

允许：

模板变量：

{{title}}
{{body}}
{{image}}
{{date}}
{{siteName}}


ARG接口：

链接：

<a data-arg-link="节点名称">

按钮：

<button data-arg-port="出口名称">

输入：

<input data-arg-input="参数名称">


插槽：

{{ARG_LINKS}}

{{ARG_CONTENT}}



禁止：

禁止：

onclick=""
onsubmit=""
onchange=""

禁止：

window.location

location.href

自己的 JavaScript 跳转逻辑


禁止：

<a href="xxx.html">


禁止：

写死其他页面名称。


---

## CSS要求

CSS可以自由设计：

允许：

- 字体
- 颜色
- 布局
- 动画
- 背景
- 图片效果

目标：

符合 ARG 氛围。

例如：

- 2000年代网站
- 老电脑界面
- 档案系统
- VHS录像
- 政府网页
- 医院系统
- 学校网站
- BBS论坛


---

## 输出内容：

请生成：

1.
template.html


2.
style.css


3.
template.json


其中：

template.json：

必须包含：

{
"id":"",
"name":"",
"type":"",
"description":"",
"fields":[],
"ports":[]
}


fields表示：
用户可以修改的内容。

ports表示：
页面可以连接到其他 ARG 节点的位置。


---

生成前，请先说明：

1. 这个页面适合什么 ARG 场景

2. 页面有哪些可连接出口

3. 需要哪些用户填写字段


然后生成文件。`
}

function CustomTemplateModal({ state, update, close, initialType = 'Browse', onSelectTemplate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(initialType)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [activeTab, setActiveTab] = useState('prompt') // 'prompt' | 'html' | 'css' | 'js'
  const [showSkill, setShowSkill] = useState(true)
  const [copied, setCopied] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileInputRef = useRef(null)

  // Prompt Builder Parameters
  const [promptParams, setPromptParams] = useState({
    pageType: `${TYPES[initialType]?.label || '浏览页'} (${initialType})`,
    style: '泛黄绝密档案卷宗 / 红色印章 / 打印机打字机排版',
    era: '1998年临江市刑侦专案组',
    purpose: '受害者加密日记 / 警方通报 / 案件线索记录',
    content: '案发时间、目击证词、嫌疑人画像与密码线索',
    specialEffect: '档案泛黄折痕、红色绝密印章、涂黑机密打码',
    reference: 'SCP基金会、临江仙、模拟犯罪档案'
  })

  const generatedPrompt = buildAIPrompt(promptParams)

  const customTemplates = state.customTemplates || []

  const detectedSlots = Array.from(new Set(Array.from(html.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(m => m[1])))
  const hasHardcodedLinks = /<a\s+[^>]*href=["'](?!#)(?!javascript:)[^"']+["']/i.test(html) || /onclick\s*=/i.test(html)
  const hasComponentTag = html.includes('data-arg-component')
  const hasDataLinks = html.includes('data-arg-link') || html.includes('data-arg-port')

  const handleFiles = files => {
    let loaded = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target.result
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          setHtml(content)
          loaded.push(file.name)
          if (!name) setName(file.name.replace(/\.(html|htm)$/i, ''))
          setActiveTab('html')
        } else if (file.name.endsWith('.css')) {
          setCss(content)
          loaded.push(file.name)
        } else if (file.name.endsWith('.js')) {
          setJs(content)
          loaded.push(file.name)
        } else if (file.name.endsWith('.json')) {
          try {
            const meta = JSON.parse(content)
            if (meta.name) setName(meta.name)
            if (meta.type && TYPES[meta.type]) setType(meta.type)
            if (meta.html) setHtml(meta.html)
            if (meta.css) setCss(meta.css)
            if (meta.js) setJs(meta.js)
            loaded.push(file.name + ' (已解析元数据)')
          } catch (_) {
            loaded.push(file.name)
          }
        }
        setUploadMsg(`已成功载入文件：${loaded.join(', ')}`)
      }
      reader.readAsText(file)
    })
  }

  const saveTemplate = () => {
    if (!name.trim()) return alert('请输入模板名称')
    if (!html.trim()) return alert('HTML 内容不能为空 (template.html)')

    update(next => {
      if (!next.customTemplates) next.customTemplates = []
      const existingIdx = next.customTemplates.findIndex(t => t.name === name.trim())
      const tplData = {
        id: existingIdx >= 0 ? next.customTemplates[existingIdx].id : 'tpl_' + Date.now(),
        name: name.trim(),
        type,
        html,
        css,
        js,
        updatedAt: new Date().toISOString()
      }
      if (existingIdx >= 0) {
        next.customTemplates[existingIdx] = tplData
      } else {
        next.customTemplates.push(tplData)
      }
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    })

    if (onSelectTemplate) {
      onSelectTemplate(name.trim())
    }
    alert(`模板「${name}」已成功注册并可在属性面板中选用！`)
  }

  const loadForEdit = tpl => {
    setName(tpl.name)
    setType(tpl.type || 'Custom')
    setHtml(tpl.html || '')
    setCss(tpl.css || '')
    setJs(tpl.js || '')
    setActiveTab('html')
    setUploadMsg(`正在编辑模板：${tpl.name}`)
  }

  const deleteTemplate = tplName => {
    if (!confirm(`确定删除自定义模板「${tplName}」吗？`)) return
    update(next => {
      next.customTemplates = (next.customTemplates || []).filter(t => t.name !== tplName)
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    })
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="modal">
      <div className="modal-card" style={{ maxWidth: 880, width: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">CUSTOM TEMPLATE STUDIO</span>
            <h2>📤 模板导入与 AI 专业提示词生成器</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="ghost" style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold' }} onClick={() => setShowSkill(!showSkill)}>
              {showSkill ? '✕ 收起 AI 提示词生成器' : '🤖 AI 提示词生成器'}
            </button>
            <button className="icon-btn" onClick={close}>×</button>
          </div>
        </div>

        {showSkill && (
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: 14, fontSize: 12, maxHeight: 310, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <strong style={{ color: '#1e293b', fontSize: 13 }}>🤖 我的需求定制（填入参数实时生成专业 AI 提示词）：</strong>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>发给 ChatGPT / Claude / DeepSeek 获取 template.html / style.css / template.json</span>
              </div>
              <button className="primary" style={{ padding: '5px 12px', fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={copyPrompt}>
                {copied ? '✓ 已复制完整提示词！' : '📋 一键复制完整 AI 提示词'}
              </button>
            </div>

            {/* Parameter Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面类型 (PAGE_TYPE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.pageType}
                  onChange={e => setPromptParams({ ...promptParams, pageType: e.target.value })}
                  placeholder="例如：Desktop 桌面页 / Chat 聊天页 / Browse 浏览页"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面风格 (STYLE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.style}
                  onChange={e => setPromptParams({ ...promptParams, style: e.target.value })}
                  placeholder="例如：2000年代网站、老电脑界面、档案系统、BBS论坛"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>时代背景 (ERA)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.era}
                  onChange={e => setPromptParams({ ...promptParams, era: e.target.value })}
                  placeholder="例如：1998年、2000年代初、未来暗网"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面用途 (PURPOSE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.purpose}
                  onChange={e => setPromptParams({ ...promptParams, purpose: e.target.value })}
                  placeholder="例如：嫌疑人日记、警方调查台、加密档案库"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面内容 (CONTENT)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.content}
                  onChange={e => setPromptParams({ ...promptParams, content: e.target.value })}
                  placeholder="例如：案发时间、目击证词、嫌疑人画像与密码线索"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>特殊效果 (SPECIAL_EFFECT)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.specialEffect}
                  onChange={e => setPromptParams({ ...promptParams, specialEffect: e.target.value })}
                  placeholder="例如：CRT扫描线、打字机光标、红色印章、机密打码"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>参考作品 (REFERENCE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.reference}
                  onChange={e => setPromptParams({ ...promptParams, reference: e.target.value })}
                  placeholder="例如：SCP基金会、临江仙、模拟犯罪档案"
                />
              </div>
            </div>

            <pre style={{ margin: 0, padding: 10, background: '#0f172a', color: '#38bdf8', borderRadius: 6, fontSize: 11, lineHeight: 1.5, maxHeight: 110, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {generatedPrompt}
            </pre>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* File Upload Drop Area */}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 8,
              padding: '14px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".html,.htm,.css,.js,.json,.txt"
              style={{ display: 'none' }}
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <div style={{ fontSize: 22, marginBottom: 2 }}>📂</div>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>点击或拖拽上传 template.html, style.css, template.json / script.js</strong>
            <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#64748b' }}>支持解析 template.json 元数据及 HTML/CSS 样式，亦可在下方直接粘贴代码。</p>
            {uploadMsg && <div style={{ marginTop: 6, fontSize: 12, color: '#059669', fontWeight: 'bold' }}>✓ {uploadMsg}</div>}
          </div>

          {/* Form Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 'bold' }}>模板名称</label>
              <input placeholder="例如：1998绝密档案、赛博黑客终端" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 'bold' }}>适用页面类型</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="Custom">🌐 通用（所有页面类型可用）</option>
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}（{k}）</option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Tabs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`tab-btn ${activeTab === 'html' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('html')}>
                  📄 template.html {html ? '✓' : ''}
                </button>
                <button className={`tab-btn ${activeTab === 'css' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('css')}>
                  🎨 style.css {css ? '✓' : ''}
                </button>
                <button className={`tab-btn ${activeTab === 'js' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('js')}>
                  ⚡ script.js (可选) {js ? '✓' : ''}
                </button>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {activeTab === 'html' ? `${html.length} 字符` : (activeTab === 'css' ? `${css.length} 字符` : `${js.length} 字符`)}
              </span>
            </div>

            {activeTab === 'html' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="<!DOCTYPE html>&#10;<html>&#10;...&#10;<h1>{{title}}</h1>&#10;<div class='content'>{{body}}</div>&#10;{{ARG_LINKS}}&#10;...&#10;</html>"
                value={html}
                onChange={e => setHtml(e.target.value)}
              />
            )}
            {activeTab === 'css' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="body { background: var(--arg-bg-color, #fff); font-family: var(--arg-font-family, sans-serif); color: var(--arg-text-color, #222); }"
                value={css}
                onChange={e => setCss(e.target.value)}
              />
            )}
            {activeTab === 'js' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="// 可选自定义专属动效代码，如打字机、声效等&#10;console.log('Custom template script loaded');"
                value={js}
                onChange={e => setJs(e.target.value)}
              />
            )}
          </div>

          {/* Live Contract Inspector */}
          <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: 10, fontSize: 11 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#334155' }}>🔍 模板契约与插槽智能检测（Live Validator）：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {detectedSlots.length > 0 ? (
                detectedSlots.map(s => (
                  <span key={s} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>
                    ✓ 插槽 {"{{" + s + "}}"}
                  </span>
                ))
              ) : (
                <span style={{ color: '#94a3b8' }}>尚未检测到任何 {"{{slot}}"} 插槽</span>
              )}
              {hasComponentTag && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>✓ 交互组件</span>}
              {hasDataLinks && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>✓ 路由出口标记</span>}
            </div>
            {hasHardcodedLinks && (
              <div style={{ marginTop: 6, color: '#b91c1c', fontWeight: 'bold' }}>
                ⚠️ 警告：检测到静态 href 链接或 onclick 事件。请改用 <code>data-arg-link="出口名"</code> 以保证 ARG 路由内核能正常拦截与跳转。
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary" style={{ flex: 1 }} onClick={saveTemplate}>
              💾 保存并注册该模板
            </button>
            <button className="ghost" onClick={() => { setName(''); setHtml(''); setCss(''); setJs(''); setUploadMsg(''); }}>
              清空重填
            </button>
          </div>

          {/* Registered Custom Templates List */}
          {customTemplates.length > 0 && (
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>
                📚 已注册的自定义模板库 ({customTemplates.length} 个)：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customTemplates.map(tpl => (
                  <div key={tpl.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                    <div>
                      <strong style={{ fontSize: 12, color: '#1e293b' }}>{tpl.name}</strong>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>[{tpl.type === 'Custom' ? '通用' : (TYPES[tpl.type]?.label || tpl.type)}]</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {onSelectTemplate && (
                        <button className="primary icon-tiny" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { onSelectTemplate(tpl.name); close(); }}>
                          应用到当前节点
                        </button>
                      )}
                      <button className="ghost icon-tiny" style={{ fontSize: 11 }} onClick={() => loadForEdit(tpl)}>
                        编辑
                      </button>
                      <button className="rule-remove" style={{ fontSize: 12 }} onClick={() => deleteTemplate(tpl.name)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ValidatorModal({ validation, onFocusNode, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="validator-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>剧情健康度与死胡同自检 (Story Graph Validator)</h2>
          <button className="ghost icon-tiny" onClick={onClose}>✕</button>
        </div>
        <div className="validator-summary-bar">
          <span className={`validator-status-badge ${validation.healthy ? 'healthy' : 'warning'}`}>
            {validation.healthy ? '✓ 蓝图链路 100% 完整' : `! 发现 ${validation.errorCount} 处严重问题 · ${validation.warningCount} 处潜在隐患`}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            可达节点: {validation.reachableCount}/{validation.totalCount} · 结局数: {validation.endingCount}
          </span>
        </div>
        <div className="validator-issues-list">
          {validation.healthy ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8, color: '#16a34a' }}>✓</div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>太棒了！所有页面均可正常到达并通关。</p>
              <p style={{ fontSize: 11.5, marginTop: 4, color: 'var(--text-muted)' }}>不存在任何孤岛卡片、死胡同页面或损坏的关键词跳转。</p>
            </div>
          ) : (
            validation.issues.map((issue, idx) => (
              <div key={idx} className={`validator-issue-item ${issue.type}`}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: issue.type === 'error' ? '#dc2626' : '#d97706', marginBottom: 2 }}>
                    {issue.type === 'error' ? '[严重缺陷]' : '[逻辑隐患]'} {issue.nodeName ? `卡片：${issue.nodeName}` : '全局'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{issue.message}</div>
                </div>
                {issue.nodeId && (
                  <button className="ghost icon-tiny" style={{ fontSize: 11, padding: '3px 8px', alignSelf: 'center' }} onClick={() => onFocusNode(issue.nodeId)}>
                    定位卡片
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

