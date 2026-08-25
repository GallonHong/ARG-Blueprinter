import searchClassic from '../templates/search/classic-search/style.css?raw'
import indexPortal from '../templates/index/portal-2001/style.css?raw'
import browseNews from '../templates/browse/news-2001/style.css?raw'
import browseBbs from '../templates/browse/bbs-thread/style.css?raw'
import loginAdmin from '../templates/login/admin/style.css?raw'
import filesWindows from '../templates/files/windows-folder/style.css?raw'
import endingCrt from '../templates/ending/crt-black/style.css?raw'

const styles={
  Search:{'经典搜索':searchClassic},
  Index:{'2001 门户':indexPortal},
  Browse:{'2001 新闻':browseNews,'BBS 帖子':browseBbs},
  Login:{'后台登录':loginAdmin},
  Files:{'Windows 文件夹':filesWindows},
  Ending:{'CRT 黑屏':endingCrt},
}

export function getTemplateStyle(type,name){return styles[type]?.[name]||''}
