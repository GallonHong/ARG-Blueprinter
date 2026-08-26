export const TYPE_THEME_PRESETS = {
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
