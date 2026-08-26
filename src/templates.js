import searchClassic from '../templates/search/classic-search/template.html?raw'
import searchTerminal from '../templates/search/terminal-search/template.html?raw'
import searchYahoo from '../templates/search/yahoo-1999/template.html?raw'
import indexPortal from '../templates/index/portal-2001/template.html?raw'
import indexArchive from '../templates/index/archive-directory/template.html?raw'
import indexWiki from '../templates/index/wiki-archive/template.html?raw'
import browseNews from '../templates/browse/news-2001/template.html?raw'
import browseBbs from '../templates/browse/bbs-thread/template.html?raw'
import browseScp from '../templates/browse/scp-document/template.html?raw'
import browseDiary from '../templates/browse/victim-diary/template.html?raw'
import browseMagazine from '../templates/browse/modern-magazine/template.html?raw'
import browseCyber from '../templates/browse/cyber-leak/template.html?raw'
import browseSurveillance from '../templates/browse/surveillance-crt/template.html?raw'
import loginAdmin from '../templates/login/admin/template.html?raw'
import loginBios from '../templates/login/bios-screen/template.html?raw'
import filesWindows from '../templates/files/windows-folder/template.html?raw'
import endingCrt from '../templates/ending/crt-black/template.html?raw'
import endingNews from '../templates/ending/newspaper-headline/template.html?raw'
import endingVerdict from '../templates/ending/final-verdict/template.html?raw'
import desktopWin98 from '../templates/desktop/win98-classic/template.html?raw'
import desktopWinXp from '../templates/desktop/winxp-luna/template.html?raw'
import desktopDark from '../templates/desktop/investigation-dark/template.html?raw'
import desktopMac from '../templates/desktop/macos-9/template.html?raw'
import desktopCyber from '../templates/desktop/cyber-matrix/template.html?raw'
import chatWechat from '../templates/chat/wechat-ui/template.html?raw'
import chatQq from '../templates/chat/qq-retro/template.html?raw'
import chatTerminal from '../templates/chat/terminal-chat/template.html?raw'
import chatDiscord from '../templates/chat/discord-dark/template.html?raw'
import chatTelegram from '../templates/chat/telegram-blue/template.html?raw'

const templates={
  Chat:{
    '微信 UI 风格':chatWechat,
    '经典 QQ 风格':chatQq,
    '暗黑加密通讯':chatTerminal,
    'Discord 社区频道':chatDiscord,
    'Telegram 风格':chatTelegram
  },
  Desktop:{
    'Windows 98 桌面':desktopWin98,
    'Windows XP 桌面':desktopWinXp,
    'Mac OS 9 桌面':desktopMac,
    '赛博朋克桌面':desktopCyber,
    '调查员工作台':desktopDark
  },
  Search:{
    '经典搜索':searchClassic,
    '终端搜索':searchTerminal,
    '1999 门户搜索':searchYahoo
  },
  Index:{
    '2001 门户':indexPortal,
    '档案目录':indexArchive,
    '维基档案百科':indexWiki
  },
  Browse:{
    'BBS 帖子':browseBbs,
    '复古 BBS 论坛':browseBbs,
    'BBS 论坛':browseBbs,
    '2001 新闻':browseNews,
    '新闻 2001':browseNews,
    '时代新闻大头条':browseNews,
    'SCP 绝密文档':browseScp,
    'SCP 绝密卷宗':browseScp,
    '遇害者手写日记':browseDiary,
    '极简现代杂志':browseMagazine,
    '黑客数据窃密流':browseCyber,
    '监控室观察记录':browseSurveillance,
    '监控室观察记录 (CRT)':browseSurveillance
  },
  Login:{
    '后台登录':loginAdmin,
    'BIOS 开机验证':loginBios
  },
  Files:{
    'Windows 文件夹':filesWindows
  },
  Ending:{
    'CRT 黑屏':endingCrt,
    '报纸头版通报':endingNews,
    '案件结案判定书':endingVerdict
  },
}

export let customTemplatesRegistry = []

export function setCustomTemplates(list) {
  customTemplatesRegistry = list || []
}

export function getTemplate(type,name){
  const custom = (customTemplatesRegistry || []).find(t => t.name === name && (t.type === type || t.type === 'Custom'))
  if (custom) return custom.html || ''
  const tMap = templates[type] || {}
  if (tMap[name]) return tMap[name]
  if (name) {
    for (const [k, v] of Object.entries(tMap)) {
      if (k.includes(name) || name.includes(k) || k.toLowerCase() === name.toLowerCase()) return v
    }
  }
  return Object.values(tMap)[0] || ''
}

export function getAllTemplatesForType(type) {
  const builtin = templates[type] ? Object.keys(templates[type]) : []
  const custom = customTemplatesRegistry.filter(t => t.type === type || t.type === 'Custom').map(t => t.name)
  return [...builtin, ...custom]
}



