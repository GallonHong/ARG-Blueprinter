import searchClassic from '../templates/search/classic-search/style.css?raw'
import searchTerminal from '../templates/search/terminal-search/style.css?raw'
import searchYahoo from '../templates/search/yahoo-1999/style.css?raw'
import indexPortal from '../templates/index/portal-2001/style.css?raw'
import indexArchive from '../templates/index/archive-directory/style.css?raw'
import indexWiki from '../templates/index/wiki-archive/style.css?raw'
import browseNews from '../templates/browse/news-2001/style.css?raw'
import browseBbs from '../templates/browse/bbs-thread/style.css?raw'
import browseScp from '../templates/browse/scp-document/style.css?raw'
import browseDiary from '../templates/browse/victim-diary/style.css?raw'
import loginAdmin from '../templates/login/admin/style.css?raw'
import loginBios from '../templates/login/bios-screen/style.css?raw'
import filesWindows from '../templates/files/windows-folder/style.css?raw'
import endingCrt from '../templates/ending/crt-black/style.css?raw'
import endingNews from '../templates/ending/newspaper-headline/style.css?raw'
import endingVerdict from '../templates/ending/final-verdict/style.css?raw'
import desktopWin98 from '../templates/desktop/win98-classic/style.css?raw'
import desktopWinXp from '../templates/desktop/winxp-luna/style.css?raw'
import desktopDark from '../templates/desktop/investigation-dark/style.css?raw'
import desktopMac from '../templates/desktop/macos-9/style.css?raw'
import desktopCyber from '../templates/desktop/cyber-matrix/style.css?raw'
import chatWechat from '../templates/chat/wechat-ui/style.css?raw'
import chatQq from '../templates/chat/qq-retro/style.css?raw'
import chatTerminal from '../templates/chat/terminal-chat/style.css?raw'
import chatDiscord from '../templates/chat/discord-dark/style.css?raw'
import chatTelegram from '../templates/chat/telegram-blue/style.css?raw'

const styles={
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
    'SCP 绝密文档':browseScp,
    '遇害者手写日记':browseDiary
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

import { customTemplatesRegistry } from './templates.js'

export function getTemplateStyle(type,name){
  const custom = (customTemplatesRegistry || []).find(t => t.name === name && (t.type === type || t.type === 'Custom'))
  if (custom) return custom.css || ''
  const sMap = styles[type] || {}
  if (sMap[name]) return sMap[name]
  if (name) {
    for (const [k, v] of Object.entries(sMap)) {
      if (k.includes(name) || name.includes(k) || k.toLowerCase() === name.toLowerCase()) return v
    }
  }
  return Object.values(sMap)[0] || ''
}



