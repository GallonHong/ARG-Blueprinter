export function getQiyuebanDemoProject() {
  const nodes = [
    // 1. 电脑桌面
    {
      id: 'node_desktop',
      name: '🖥️ 温水青的电脑桌面',
      type: 'Desktop',
      template: 'Windows XP 桌面',
      x: 80,
      y: 80,
      isStart: true,
      fields: {
        systemName: '温水青的主机 (Windows XP Pro)',
        stickyNote: '📌 调查备忘录：\n1. 七月半论坛注册已关闭，通过聊天软件联络《奇闻调查》记者明月夜。\n2. 隐藏机密文件夹密码提示：异想之夜大典拼音首字母。\n3. 在搜索引擎检索“失踪”、“南鄣”、“运契”、“泰永集团”。',
        startTitle: '开始',
        time: '2026-02-20 23:17',
        primaryColor: '#000080',
        bgColor: 'linear-gradient(180deg, #1b5cb8 0%, #4691e8 45%, #63b333 75%, #3c821b 100%)',
        cardBg: '#c0c0c0',
        textColor: '#ffffff',
        fontFamily: '"MS Sans Serif", "SimSun", "宋体", sans-serif'
      }
    },

    // 2. 加密通讯
    {
      id: 'node_chat',
      name: '💬 加密聊天软件',
      type: 'Chat',
      template: '微信 UI 风格',
      x: 380,
      y: 80,
      fields: {
        siteName: '即时加密通讯 (在线)',
        primaryColor: '#95ec69',
        bgColor: '#f0f2f5',
        cardBg: '#ffffff',
        textColor: '#333333'
      },
      contacts: [
        {
          id: 'mingyueye',
          name: '明月夜 (《奇闻调查》记者)',
          bio: '《奇闻调查》特约栏目记者 · 专注于离奇事件追踪',
          avatar: '📰',
          messages: [
            { sender: 'npc', text: '温小姐您好，我是《奇闻调查》的记者明月夜。' },
            { sender: 'npc', text: '请问您是否是七月半论坛的正式用户？几番辗转才找到您的联系方式。' },
            { sender: 'player', text: '怎么了？是要我帮你搜集灵异事件吗？' },
            { sender: 'npc', text: '我们在调查九华高中女生失踪案与南鄣市运契互助会...你是否有关键证据？' },
            { sender: 'npc', text: '请选择你打算提交的调查方向：' }
          ],
          choices: [
            { text: '📁 提供云留山调查报告', target: 'node_end1' },
            { text: '🚨 提供九华高中失踪线索', target: 'node_end2' },
            { text: '⚖️ 联合实名举报泰永集团', target: 'node_end3' },
            { text: '🌊 追查“长生葬”真相', target: 'node_end4' },
            { text: '🌅 公开全部内幕，迎接明天', target: 'node_end5' }
          ]
        },
        {
          id: 'qiaoqiao',
          name: '乔乔 (妹妹)',
          bio: '妹妹 · 正在南鄣市读大学',
          avatar: '👧',
          messages: [
            { sender: 'npc', text: '姐，你到底在哪儿？快回电话！' },
            { sender: 'player', text: '我还在调查一些事情，别担心。' },
            { sender: 'npc', text: '家里收到了一封奇怪的信件，上面写着“渡生大醮”...你千万小心！' }
          ],
          choices: [
            { text: '放心，我很快就破案了', target: 'node_desktop' }
          ]
        },
        {
          id: 'guibujue',
          name: '鬼不觉 (论坛调查人)',
          bio: '七月半论坛资深坛友 · 代号【鬼不觉】',
          avatar: '🕵️',
          messages: [
            { sender: 'npc', text: '水青，千万不要在论坛公开发帖！管理层有内鬼。' },
            { sender: 'npc', text: '隐藏文件夹密码是七个小写字母：yxzyddx（异想之夜大典）。' },
            { sender: 'player', text: '收到，我这就去查电脑上的加密文件夹。' }
          ],
          choices: [
            { text: '🔐 前往打开机密文件夹', target: 'node_login' }
          ]
        },
        {
          id: 'xiaoqingyu',
          name: '小青鱼 (神秘失踪人员)',
          bio: '状态异常 · 信号微弱',
          avatar: '🐟',
          messages: [
            { sender: 'npc', text: '救救我……这里好黑……' },
            { sender: 'npc', text: '他们要把我带去延盛岛……不要相信宋青云！' }
          ],
          choices: [
            { text: '🔍 去搜索引擎查【延盛岛】与【宋青云】', target: 'node_search' }
          ]
        }
      ]
    },

    // 3. 七月半灵异论坛首页
    {
      id: 'node_forum',
      name: '🌐 七月半灵异论坛',
      type: 'Browse',
      template: '复古 BBS 论坛',
      x: 80,
      y: 280,
      fields: {
        siteName: '七月半灵异论坛 (BBS 社区)',
        title: '【七月半】用户必读与最新调查汇总',
        date: '2026-02-20',
        author: '温水青',
        forumName: '都市异闻 / 灵异实录',
        username: '温水青 (Lv.7 调查员)',
        time: '23:15:00',
        body: '欢迎来到七月半灵异论坛。近期关于九华高中学生失踪、公寓闹鬼、婚礼直播等怪事频发。\n\n本版置顶精选帖：\n• <a data-arg-link="AI恐怖谷讨论">讨论：关于 AI 的恐怖谷效应</a>\n• <a data-arg-link="公寓遇鬼">我住的公寓又遇见鬼了</a>\n• <a data-arg-link="全网搜索引擎">点击进入【全网线索搜索引擎】</a>\n• <a data-arg-link="返回电脑桌面">返回电脑桌面</a>',
        replies: '知足常乐：最近论坛越来越诡异了，好多老用户的头像都变黑了……\n鬼不觉：水青，看私聊！管理层在清理帖子！\nsmile：那个婚礼直播到底是谁开的？'
      }
    },

    // 4. 全网搜索引擎
    {
      id: 'node_search',
      name: '🔍 全网线索搜索引擎',
      type: 'Search',
      template: '经典搜索',
      x: 380,
      y: 280,
      fields: {
        siteName: '千禧搜索 (Search Archive)',
        subtitle: '全网海量数据检索 · 灵异与失踪线索查询系统',
        notice: '💡 提示：输入关键词检索线索，例如：失踪、南鄣、泰永集团、宋青云、延盛岛、运契、渡生大醮',
        placeholder: '请输入线索关键词...',
        buttonText: '搜索档案',
        notFoundText: '抱歉，没有找到相关线索记录。请尝试检索：失踪、南鄣、泰永集团、运契、渡生大醮。'
      },
      rules: [
        { keyword: '失踪', target: 'node_news_shizong' },
        { keyword: '南鄣', target: 'node_news_nanzhang' },
        { keyword: '南鄣市', target: 'node_news_nanzhang' },
        { keyword: '泰永集团', target: 'node_news_taiyong' },
        { keyword: '宋青云', target: 'node_news_taiyong' },
        { keyword: '延盛岛', target: 'node_news_yansheng' },
        { keyword: '运契', target: 'node_news_yunqi' },
        { keyword: '渡生大醮', target: 'node_doc_dusheng' },
        { keyword: 'ai', target: 'node_post_ai' },
        { keyword: '恐怖谷', target: 'node_post_ai' },
        { keyword: '公寓', target: 'node_post_gyg' },
        { keyword: '鬼', target: 'node_post_gyg' }
      ]
    },

    // 5. 机密文件夹密码锁
    {
      id: 'node_login',
      name: '🔐 机密文件夹密码锁',
      type: 'Login',
      template: '后台登录',
      x: 680,
      y: 80,
      fields: {
        systemName: '温水青的机密档案保险箱',
        password: 'yxzyddx'
      }
    },

    // 18. 机密档案库文件夹
    {
      id: 'node_files',
      name: '📁 机密档案库文件夹',
      type: 'Files',
      template: 'Windows 文件夹',
      x: 980,
      y: 80,
      fields: {
        path: 'C:\\温水青\\机密调查档案\\0717_ARCHIVE\\'
      }
    },

    // 6. 论坛帖子：AI 恐怖谷
    {
      id: 'node_post_ai',
      name: '📰 帖子：AI 恐怖谷讨论',
      type: 'Browse',
      template: '复古 BBS 论坛',
      x: 80,
      y: 480,
      fields: {
        siteName: '七月半灵异论坛',
        title: '讨论：关于 AI 的恐怖谷效应',
        date: '2026-02-18',
        author: '蝴蝶与飞雪',
        forumName: '都市怪谈 / 科技前沿',
        username: '蝴蝶与飞雪',
        body: '大家有没有发现，最近论坛里有些账号回复非常机械化？就像是被某种大模型克隆了一样……\n更可怕的是，这些账号的主人其实早在现实中失踪了！\n\n<a data-arg-link="返回论坛首页">← 返回论坛首页</a> | <a data-arg-link="全网线索搜索引擎">前往搜索引擎检索</a>'
      }
    },

    // 7. 论坛帖子：公寓遇鬼
    {
      id: 'node_post_gyg',
      name: '📰 帖子：我住的公寓又遇鬼了',
      type: 'Browse',
      template: '复古 BBS 论坛',
      x: 380,
      y: 480,
      fields: {
        siteName: '七月半灵异论坛',
        title: '我住的公寓又遇见鬼了',
        date: '2026-02-19',
        author: '落雨',
        forumName: '灵异实录',
        username: '落雨',
        body: '半夜两点，门口又传来了抓门声。我从猫眼看出去，外面站着一个穿着校服的女生……\n衣服上绣着【九华高中】！\n\n<a data-arg-link="返回论坛首页">← 返回论坛首页</a> | <a data-arg-link="全网线索搜索引擎">检索九华高中线索</a>'
      }
    },

    // 13. 新闻：女大学生失踪
    {
      id: 'node_news_shizong',
      name: '📰 新闻：女大学生失踪案',
      type: 'Browse',
      template: '门户新闻',
      x: 680,
      y: 280,
      fields: {
        siteName: '南鄣早报 · 热点新闻',
        title: '九华高中女生离奇失踪，警方正在全力搜救',
        date: '2026-02-15',
        author: '本报记者 晨曦',
        body: '【警方通报】近日，南鄣市九华高中学生小青在放学途中失联，监控显示其最后出现在云留山公路附近。\n据知情人士透露，失踪前她曾参与过“运契互助会”的线下聚会……\n\n<a data-arg-link="全网线索搜索引擎">← 返回搜索引擎</a> | <a data-arg-link="加密聊天软件">联络记者明月夜</a>'
      }
    },

    // 14. 深度报道：探秘南鄣市
    {
      id: 'node_news_nanzhang',
      name: '📰 报道：探秘南鄣市与延盛岛',
      type: 'Browse',
      template: '门户新闻',
      x: 980,
      y: 280,
      fields: {
        siteName: '南鄣城市网 · 历史特刊',
        title: '南鄣秘辛：延盛岛民俗与千年祭典',
        date: '2026-02-10',
        author: '文史研究员 陆明',
        body: '南鄣市东南沿海的延盛岛，自古流传着“渡生大醮”之俗。当地居民相信通过特定仪式可以借运延年。近年来，泰永集团宋青云全资资助了该岛的搬迁与重建……\n\n<a data-arg-link="全网线索搜索引擎">← 返回搜索引擎</a>'
      }
    },

    // 15. 专访：泰永集团董事长宋青云
    {
      id: 'node_news_taiyong',
      name: '📰 专访：宋青云与泰永集团',
      type: 'Browse',
      template: '门户新闻',
      x: 680,
      y: 480,
      fields: {
        siteName: '商业周刊',
        title: '宋青云专访：从渔村少年到商业巨鳄的慈善之路',
        date: '2026-01-28',
        author: '财经观察',
        body: '泰永集团董事长宋青云表示：“运契互助会是我们践行社会责任的桥梁。”然而调查显示，该协会实际控制了七月半论坛的服务器托管权……\n\n<a data-arg-link="加密聊天软件">在聊天软件中揭发宋青云</a> | <a data-arg-link="全网线索搜索引擎">返回搜索</a>'
      }
    },

    // 16. 公益通报：运契互助会
    {
      id: 'node_news_yunqi',
      name: '📰 通报：“运契”互助会调查',
      type: 'Browse',
      template: '门户新闻',
      x: 980,
      y: 480,
      fields: {
        siteName: '法治南鄣',
        title: '警惕新型“转运契约”陷阱',
        date: '2026-02-05',
        author: '法治记者',
        body: '警方提醒：“运契互助会”打着互助旗号，实则利用封建迷信《渡生大醮仪》进行精神控制与人口拐骗，主要涉案密码为【yxzyddx】。\n\n<a data-arg-link="渡生大醮仪古籍">查看《渡生大醮仪》</a> | <a data-arg-link="全网线索搜索引擎">返回搜索</a>'
      }
    },

    // 17. 古籍绝密文献《渡生大醮仪》
    {
      id: 'node_doc_dusheng',
      name: '📜 文献：《渡生大醮仪》',
      type: 'Browse',
      template: '牛皮纸手写日记',
      x: 1280,
      y: 280,
      fields: {
        siteName: '绝密古籍拓本',
        title: '《渡生大醮仪》卷三 · 移花接木篇',
        date: '民国三十六年录',
        author: '南鄣隐士',
        body: '以生人之八字，结阴阳互通之契，引魂归兮，移花接木，借寿延生……\n凡开坛者，皆诵暗号：异想之夜大典（拼音首字母 yxzyddx）。\n若得此密匙，可启机密之箱。\n\n<a data-arg-link="打开机密文件夹">🔐 前往输入密码解锁文件夹</a> | <a data-arg-link="返回电脑桌面">返回电脑桌面</a>',
        primaryColor: '#8b2500',
        bgColor: '#3d2f23',
        cardBg: '#f4ecd8',
        textColor: '#2c1d11',
        fontFamily: '"KaiTi", "楷体", serif'
      }
    },

    // 19. 温岩考察日记
    {
      id: 'node_doc_wenyan',
      name: '📑 档案：温岩考察日记',
      type: 'Browse',
      template: '绝密档案卷宗',
      x: 1280,
      y: 80,
      fields: {
        siteName: '南鄣市刑侦支队 · 证据档案',
        title: '1998年云留山考古队领队温岩绝密绝笔日记',
        date: '1998-07-17',
        author: '温岩',
        body: '1998年7月17日 暴雨\n我们在云留山地下溶洞发现了巨大的祭祀供奉墙。泰永集团的前身【泰永商行】在五十年前就开始秘密实验了。\n如果我没能活着回去，水青，一定要找到真相！\n\n<a data-arg-link="返回机密文件夹">← 返回机密文件夹</a> | <a data-arg-link="加密聊天软件">联络明月夜制定结案策略</a>'
      }
    },

    // 20. 嫌疑人杨威口供记录
    {
      id: 'node_doc_yangwei',
      name: '📑 档案：杨威审讯口供',
      type: 'Browse',
      template: '严肃公文',
      x: 1280,
      y: 480,
      fields: {
        siteName: '南鄣市公安局审讯笔录',
        title: '犯罪嫌疑人杨威第一阶段审讯口供',
        date: '2026-02-19',
        author: '审讯员：张警官、刘警官',
        body: '审讯记录：杨威交代，所有受害者的联系方式均被登记在七月半论坛的后台数据库中。只要在聊天软件中做出最终决断，整个案件即可告破。\n\n<a data-arg-link="返回机密文件夹">← 返回机密文件夹</a> | <a data-arg-link="加密聊天软件">进入聊天软件做最终选择</a>'
      }
    },

    // 8. 结局一
    {
      id: 'node_end1',
      name: '🎬 结局一 · 云留山事件',
      type: 'Ending',
      template: '报纸头版通报',
      x: 80,
      y: 680,
      fields: {
        message: '【结局一：云留山事件】\n千福县警方通报：云留山非法窝点已被捣毁，但关键涉案人员宋青云依然潜逃。你提交的线索未能彻底揭开所有真相。'
      }
    },

    // 9. 结局二
    {
      id: 'node_end2',
      name: '🎬 结局二 · 深夜遇害',
      type: 'Ending',
      template: 'CRT 黑屏',
      x: 380,
      y: 680,
      fields: {
        message: '【结局二：遇害】\n你独自前往九华高中旧址调查，陷入了对方布下的致命陷阱。凶手至今下落不明，手机信号永远定格在深夜。'
      }
    },

    // 10. 结局三
    {
      id: 'node_end3',
      name: '🎬 结局三 · 记者实名举报',
      type: 'Ending',
      template: '案件结案判定书',
      x: 680,
      y: 680,
      fields: {
        message: '【结局三：实名举报】\n你与记者明月夜联合向最高检实名举报泰永集团。虽然面临巨大的阻力与风险，但正义的齿轮已经开始转动。'
      }
    },

    // 11. 结局四
    {
      id: 'node_end4',
      name: '🎬 结局四 · 长生葬',
      type: 'Ending',
      template: '报纸头版通报',
      x: 980,
      y: 680,
      fields: {
        message: '【结局四：长生葬】\n南鄣文明网报道：“长生葬”传统民俗活动顺利举行。表面风平浪静，暗地里的阴影却仍在继续滋生……'
      }
    },

    // 12. 结局五
    {
      id: 'node_end5',
      name: '🎬 结局五 · 明天 (True End)',
      type: 'Ending',
      template: '案件结案判定书',
      x: 1280,
      y: 680,
      fields: {
        message: '【结局五：明天 (True End)】\n真相大白！你成功收集并破译了七月半论坛、渡生大醮、运契互助会以及宋青云犯罪集团的全部证据链！\n王玉萍等人被依法公诉，失踪受害者得以安息。\n晨光破晓，明天终于到来。\n\n—— 全线通关，感谢游玩！ ——'
      }
    }
  ];

  const edges = [
    // Desktop routes
    { from: 'node_desktop', to: 'node_chat', port: '聊天通讯.exe', label: '聊天通讯.exe', icon: '💬', desc: '打开加密聊天软件' },
    { from: 'node_desktop', to: 'node_forum', port: '七月半论坛.exe', label: '七月半论坛.exe', icon: '🌐', desc: '打开七月半灵异论坛' },
    { from: 'node_desktop', to: 'node_search', port: '全盘搜索.exe', label: '全盘搜索.exe', icon: '🔍', desc: '启动全网搜索引擎' },
    { from: 'node_desktop', to: 'node_login', port: '机密文件夹', label: '机密文件夹', icon: '🔐', desc: '打开需要密码的机密文件夹' },

    // Chat choices to Endings & others
    { from: 'node_chat', to: 'node_end1', port: '提供云留山调查报告', label: '提供云留山报告', desc: '分支一' },
    { from: 'node_chat', to: 'node_end2', port: '提供九华高中失踪线索', label: '提供九华高中线索', desc: '分支二' },
    { from: 'node_chat', to: 'node_end3', port: '联合实名举报泰永集团', label: '实名举报泰永集团', desc: '分支三' },
    { from: 'node_chat', to: 'node_end4', port: '追查“长生葬”真相', label: '追查长生葬', desc: '分支四' },
    { from: 'node_chat', to: 'node_end5', port: '公开全部内幕，迎接明天', label: '公开全部内幕', desc: '真结局' },
    { from: 'node_chat', to: 'node_desktop', port: '返回电脑桌面', label: '返回桌面', desc: '' },
    { from: 'node_chat', to: 'node_login', port: '前往打开机密文件夹', label: '解密文件夹', desc: '' },
    { from: 'node_chat', to: 'node_search', port: '去搜索引擎查【延盛岛】与【宋青云】', label: '搜索线索', desc: '' },

    // Forum routes
    { from: 'node_forum', to: 'node_post_ai', port: 'AI恐怖谷讨论', label: 'AI恐怖谷讨论', desc: '' },
    { from: 'node_forum', to: 'node_post_gyg', port: '公寓遇鬼', label: '公寓遇鬼帖子', desc: '' },
    { from: 'node_forum', to: 'node_search', port: '全网搜索引擎', label: '全网搜索引擎', desc: '' },
    { from: 'node_forum', to: 'node_desktop', port: '返回电脑桌面', label: '返回电脑桌面', desc: '' },

    // Search rules routes
    { from: 'node_search', to: 'node_news_shizong', port: '失踪', label: '女大学生失踪案', desc: '搜索关键词：失踪' },
    { from: 'node_search', to: 'node_news_nanzhang', port: '南鄣', label: '探秘南鄣市', desc: '搜索关键词：南鄣' },
    { from: 'node_search', to: 'node_news_taiyong', port: '泰永集团', label: '宋青云与泰永集团', desc: '搜索关键词：泰永集团/宋青云' },
    { from: 'node_search', to: 'node_news_yunqi', port: '运契', label: '运契互助会', desc: '搜索关键词：运契' },
    { from: 'node_search', to: 'node_doc_dusheng', port: '渡生大醮', label: '《渡生大醮仪》', desc: '搜索关键词：渡生大醮' },
    { from: 'node_search', to: 'node_post_ai', port: 'ai', label: 'AI恐怖谷', desc: '搜索关键词：ai/恐怖谷' },
    { from: 'node_search', to: 'node_post_gyg', port: '公寓', label: '公寓遇鬼', desc: '搜索关键词：公寓/鬼' },
    { from: 'node_search', to: 'node_desktop', port: '返回电脑桌面', label: '返回桌面', desc: '' },
    { from: 'node_search', to: 'node_chat', port: '进入加密通讯', label: '进入聊天', desc: '' },
    { from: 'node_search', to: 'node_forum', port: '七月半论坛', label: '进入论坛', desc: '' },

    // Login route
    { from: 'node_login', to: 'node_files', port: '解锁机密文件夹', label: '解锁机密文件夹', desc: '密码：yxzyddx' },

    // Files routes
    { from: 'node_files', to: 'node_doc_wenyan', port: '温岩考察日记.doc', label: '温岩考察日记.doc', icon: '📄', desc: '' },
    { from: 'node_files', to: 'node_doc_dusheng', port: '渡生大醮仪.pdf', label: '渡生大醮仪.pdf', icon: '📜', desc: '' },
    { from: 'node_files', to: 'node_doc_yangwei', port: '杨威口供记录.txt', label: '杨威口供记录.txt', icon: '📝', desc: '' },
    { from: 'node_files', to: 'node_desktop', port: '返回桌面', label: '返回桌面', icon: '💻', desc: '' },

    // News/Doc cross links
    { from: 'node_post_ai', to: 'node_forum', port: '返回论坛首页', label: '返回论坛', desc: '' },
    { from: 'node_post_ai', to: 'node_search', port: '全网线索搜索引擎', label: '前往搜索', desc: '' },
    { from: 'node_post_gyg', to: 'node_forum', port: '返回论坛首页', label: '返回论坛', desc: '' },
    { from: 'node_post_gyg', to: 'node_search', port: '全网线索搜索引擎', label: '前往搜索', desc: '' },
    { from: 'node_news_shizong', to: 'node_search', port: '全网线索搜索引擎', label: '返回搜索', desc: '' },
    { from: 'node_news_shizong', to: 'node_chat', port: '加密聊天软件', label: '联络明月夜', desc: '' },
    { from: 'node_news_nanzhang', to: 'node_search', port: '全网线索搜索引擎', label: '返回搜索', desc: '' },
    { from: 'node_news_taiyong', to: 'node_chat', port: '加密聊天软件', label: '揭发宋青云', desc: '' },
    { from: 'node_news_taiyong', to: 'node_search', port: '全网线索搜索引擎', label: '返回搜索', desc: '' },
    { from: 'node_news_yunqi', to: 'node_doc_dusheng', port: '渡生大醮仪古籍', label: '查看渡生大醮仪', desc: '' },
    { from: 'node_news_yunqi', to: 'node_search', port: '全网线索搜索引擎', label: '返回搜索', desc: '' },
    { from: 'node_doc_dusheng', to: 'node_login', port: '打开机密文件夹', label: '前往解密', desc: '' },
    { from: 'node_doc_dusheng', to: 'node_desktop', port: '返回电脑桌面', label: '返回桌面', desc: '' },
    { from: 'node_doc_wenyan', to: 'node_files', port: '返回机密文件夹', label: '返回文件夹', desc: '' },
    { from: 'node_doc_wenyan', to: 'node_chat', port: '加密聊天软件', label: '联络明月夜', desc: '' },
    { from: 'node_doc_yangwei', to: 'node_files', port: '返回机密文件夹', label: '返回文件夹', desc: '' },
    { from: 'node_doc_yangwei', to: 'node_chat', port: '加密聊天软件', label: '前往聊天做决断', desc: '' }
  ];

  return {
    title: '灵异论坛调查模仿',
    startId: 'node_desktop',
    nodes,
    edges,
    customTemplates: [],
    selected: 'node_desktop'
  };
}
