import searchClassic from '../templates/search/classic-search/template.html?raw'
import indexPortal from '../templates/index/portal-2001/template.html?raw'
import browseNews from '../templates/browse/news-2001/template.html?raw'
import browseBbs from '../templates/browse/bbs-thread/template.html?raw'
import loginAdmin from '../templates/login/admin/template.html?raw'
import filesWindows from '../templates/files/windows-folder/template.html?raw'
import endingCrt from '../templates/ending/crt-black/template.html?raw'

const templates={
  Search:{'经典搜索':searchClassic},
  Index:{'2001 门户':indexPortal},
  Browse:{'2001 新闻':browseNews,'BBS 帖子':browseBbs},
  Login:{'后台登录':loginAdmin},
  Files:{'Windows 文件夹':filesWindows},
  Ending:{'CRT 黑屏':endingCrt},
}

export function getTemplate(type,name){return templates[type]?.[name]||templates[type]&&Object.values(templates[type])[0]}
