# ARG Blueprint — MVP 产品需求文档（PRD）

## 1. 产品概述

### 1.1 产品名称

**ARG Blueprint**

暂定副标题：

> 用思维导图生成可玩的 ARG 网页

### 1.2 产品定位

ARG Blueprint 是一个面向 ARG 创作者、独立游戏开发者和 Vibe Coding 初学者的**可视化网页 ARG 生成工具**。

用户无需手动编写复杂前端逻辑，只需要：

1. 创建页面节点
2. 选择页面类型
3. 选择对应 HTML 模板
4. 填写页面内容
5. 使用连线定义页面跳转和触发条件
6. 预览游戏
7. 导出纯 HTML / CSS / 少量 JavaScript

最终生成的游戏不依赖 React、Vue、Node.js 或数据库，可以直接部署到 GitHub Pages、Cloudflare Pages、Vercel 或任何静态服务器。

---

# 2. 产品目标

## 2.1 核心目标

让一个**不会写网页代码的 ARG 创作者**，也能够通过类似 UE5 Blueprint / 思维导图的方式，在较短时间内完成一个可玩的多页面 ARG。

核心体验：

> **画剧情流程 → 选择网页模板 → 一键生成游戏**

---

## 2.2 MVP 成功标准

用户能够在工具内完成以下案例：

```text
                    搜索“陈远”
                  ┌──────────────→ 案件详情
                  │
百度搜索页面 ─────┤
                  │
                  └─ 密码=0717 ──→ 通关页面
```

点击 Preview 后可以实际游玩。

点击 Export 后得到：

```text
game/
├── index.html
├── case.html
├── ending.html
├── style.css
└── game.js
```

生成项目可独立运行。

---

# 3. 非目标

MVP 暂时不开发：

- AI NPC
- Three.js
- 多人协作
- 用户账号
- 云端项目保存
- 后端数据库
- 可视化网页排版编辑器
- 拖拽式 HTML Builder
- React/Vue 游戏导出
- 高级变量系统
- 任意 JavaScript 编程
- Undo / Redo 完整历史
- GitHub 自动发布
- AI 自动生成整个游戏
- 音视频高级事件
- 自定义脚本插件系统

原则：

> **MVP 只解决“思维导图 → 多页面 HTML ARG”。**

---

# 4. 目标用户

## 4.1 ARG 新手

特点：

- 有剧情想法
- 不会前端
- 不理解 HTML / CSS / JavaScript
- 希望快速做出第一个作品

需求：

> 不学完整前端，也能做一个简单 ARG。

---

## 4.2 Vibe Coding 用户

特点：

- 会使用 Codex、OpenCode、Cursor 等 Agent
- 能让 AI 修改项目
- 自己编程能力有限

需求：

> 先用 Blueprint 生成稳定结构，再让 Agent 深度修改。

---

## 4.3 有前端经验的 ARG 创作者

需求：

- 快速搭建剧情结构
- 自己设计 HTML 模板
- 不想重复写页面跳转逻辑

后续可提供：

> Custom Template / Import Template

MVP 可以只预留接口。

---

# 5. 核心设计原则

## 5.1 页面逻辑与页面外观分离

ARG Blueprint 中最重要的抽象：

> **Page Type 决定页面能做什么。**

> **Template 决定页面长什么样。**

例如：

```text
Page Type:
Browse

Template:
2001地方新闻
```

也可以：

```text
Page Type:
Browse

Template:
BBS帖子
```

两者逻辑完全一样，都支持多个超链接出口。

---

## 5.2 导出结果尽量简单

编辑器可以使用：

- React
- Vite
- React Flow

但生成的游戏只包含：

```text
HTML
CSS
少量 Vanilla JavaScript
Assets
```

生成后的网页不得依赖 ARG Blueprint 本身。

---

## 5.3 用户设计剧情，而不是写代码

用户看到：

```text
密码 = 0717
        ↓
    Ending
```

而不是：

```js
if (password === "0717") {
    location.href = "ending.html";
}
```

代码由 Generator 自动产生。

---

# 6. 页面类型

MVP 第一版提供 6 种页面类型。

---

## 6.1 Search — 搜索页

### 用途

模拟：

- 搜索引擎
- 网站内部搜索
- 档案检索系统
- 数据库检索

### 核心功能

用户可以设置多个关键词规则。

示例：

```text
搜索“陈远”
→ chen.html

搜索“0717”
→ case.html

其他
→ 显示“没有找到相关结果”
```

### Inspector

```text
Page Name
[百度搜索]

Filename
[index.html]

Template
[Baidu Old ▼]


SEARCH RULES

关键词
[陈远]

目标
[陈远资料 ▼]

[+ Add Rule]


DEFAULT ACTION
[显示无结果]
```

---

# 6.2 Index — 索引页

### 用途

适用于：

- 网站首页
- 门户
- 新闻栏目
- 档案目录
- 软件资源站
- 内容索引

### 特点

一个页面拥有多个普通出口。

例如：

```text
临江在线
├─ 新闻
├─ 论坛
├─ 搜索
└─ 下载
```

每一个条目连接一个 Page Node。

---

# 6.3 Browse — 浏览页

### 用途

最通用的正文页面。

可表现为：

- 新闻
- BBS 帖子
- 个人博客
- 政府公告
- 档案
- 说明文档
- 普通网页

### 功能

页面包含正文以及任意数量的超链接。

例如：

```text
常青苑发现身份不明死者

正文……

相关新闻：
→ 七号楼居民采访
→ 警方情况通报
→ 返回首页
```

---

# 6.4 Login — 登录页

### 用途

模拟：

- 管理员后台
- 论坛登录
- 邮箱登录
- 数据库认证
- 密码门

### MVP 功能

支持：

```text
Password Equals
```

例如：

```text
password == "0717"
→ archive.html
```

可选错误反馈：

```text
密码错误
```

MVP 不要求真实账号系统。

---

# 6.5 Files — 文件页

### 用途

模拟：

- Windows 文件目录
- FTP
- 下载页面
- 附件列表
- 档案目录

例如：

```text
C:\ARCHIVE\0717\

readme.txt
body.jpg
record.doc
backup
```

每个文件实际上是一个出口。

例如：

```text
readme.txt → readme.html
body.jpg   → photo.html
backup     → backup.html
```

底层逻辑可以复用 Index。

Files 主要是视觉模板与语义不同。

---

# 6.6 Ending — 结局页

### 用途

- 通关
- 失败
- Chapter Ending
- 系统崩溃
- 黑屏
- To Be Continued

默认没有输出端口。

---

# 7. 模板系统

## 7.1 基本原则

一个 Page Type 可以拥有多个 Template。

例如：

### Search

```text
Search
├─ 百度风格
├─ Google 2001
├─ 站内搜索
└─ 档案检索
```

### Browse

```text
Browse
├─ 2001地方新闻
├─ BBS帖子
├─ 政府公告
├─ 个人博客
└─ 纯文本档案
```

### Index

```text
Index
├─ 门户首页
├─ 新闻目录
├─ 档案索引
├─ FTP Index
└─ 软件资源站
```

### Login

```text
Login
├─ 后台登录
├─ 论坛登录
├─ 邮箱登录
└─ 数据库认证
```

### Files

```text
Files
├─ Windows文件夹
├─ FTP目录
├─ 附件列表
└─ 下载中心
```

### Ending

```text
Ending
├─ Normal Ending
├─ 黑屏
├─ 系统错误
└─ 404 Ending
```

---

# 8. 模板字段系统

不同模板可以声明自己的输入字段。

例如：

## 8.1 新闻模板

```text
网站名称
标题
日期
作者
正文
```

Inspector：

```text
网站名称
[临江在线]

标题
[常青苑发现身份不明死者]

日期
[2001-07-17]

作者
[本报记者]

正文
[........................]
```

---

## 8.2 BBS 模板

字段：

```text
论坛名称
用户名
发布时间
帖子标题
正文
```

---

## 8.3 Search 模板

字段：

```text
网站名称
Logo文字
Input Placeholder
按钮文字
页脚文字
```

---

# 9. Blueprint 编辑器

## 9.1 整体布局

```text
┌───────────────────────────────────────────────────────┐
│ ARG Blueprint       Preview      Build      Export   │
├──────────┬─────────────────────────────┬──────────────┤
│          │                             │              │
│ Pages    │      Blueprint Canvas       │ Inspector    │
│          │                             │              │
│ Browse   │      Search                │ Page         │
│ Search   │         │                  │ Name         │
│ Index    │         ↓                  │ Template     │
│ Login    │       Case                 │ Content      │
│ Files    │         │                  │              │
│ Ending   │         ↓                  │ Rules        │
│          │       Ending               │              │
├──────────┴─────────────────────────────┴──────────────┤
│ Status / Errors                                      │
└───────────────────────────────────────────────────────┘
```

---

# 10. 左侧页面库

显示：

```text
PAGES

Basic
  Browse
  Index

Input
  Search
  Login

ARG
  Files

Flow
  Ending
```

用户拖动类型到 Canvas 创建节点。

---

# 11. Page Node

节点显示：

```text
┌────────────────────────┐
│ 🔎 百度搜索             │
│ index.html             │
│                        │
│ 陈远              ○    │
│ 0717              ○    │
└────────────────────────┘
```

不同页面类型可以拥有动态 Output Port。

例如 Browse：

```text
┌────────────────────────┐
│ 📰 案件详情             │
│ case.html              │
│                        │
│ 居民采访          ○    │
│ 警方通报          ○    │
│ 返回首页          ○    │
└────────────────────────┘
```

---

# 12. 连线系统

连线表示：

> 某种用户操作最终进入另一个页面。

例如：

```text
Search
  陈远 ○────────→ Chen Profile
```

或者：

```text
Login
  Success ○──────→ Archive
```

删除连线后，不再生成对应跳转。

---

# 13. Inspector

选中不同对象时显示不同编辑内容。

---

## 13.1 Page Inspector

```text
PAGE

Name
[案件详情]

Filename
[case.html]

Type
Browse

Template
[2001地方新闻 ▼]
```

下面根据模板自动生成 Content 字段。

---

## 13.2 Search Rule Inspector

```text
SEARCH RULE

Keyword
[陈远]

Match
[Exact ▼]

Target
[Chen Profile ▼]
```

MVP 只要求：

```text
Exact Match
```

后续支持：

```text
Contains
Regex
Multiple Keywords
```

---

## 13.3 Login Inspector

```text
LOGIN

Password
[0717]

Success Target
[Archive]

Failure
[显示错误文字]

Error Message
[密码错误]
```

---

# 14. 页面跳转模型

MVP 只包含三类逻辑。

## 14.1 普通链接

```text
点击
↓
另一个页面
```

用于：

- Browse
- Index
- Files

---

## 14.2 条件输入

```text
Input
↓
与值进行比较
↓
匹配
↓
跳转
```

用于：

- Search
- Login

---

## 14.3 终点

```text
Ending
```

无输出。

---

# 15. 数据结构

建议核心 Project Schema：

```js
{
  project: {
    name: "My ARG"
  },

  pages: [],

  edges: []
}
```

页面示例：

```js
{
  id: "case",
  name: "案件详情",

  type: "browse",
  templateId: "news-2001",

  filename: "case.html",

  content: {
    siteName: "临江在线",
    title: "常青苑发现身份不明死者",
    date: "2001-07-17",
    body: "..."
  },

  outputs: [
    {
      id: "interview",
      label: "居民采访"
    },
    {
      id: "police",
      label: "警方通报"
    }
  ],

  position: {
    x: 500,
    y: 300
  }
}
```

Edge：

```js
{
  id: "edge-01",

  sourcePage: "case",
  sourcePort: "interview",

  targetPage: "interview-page"
}
```

Search：

```js
{
  id: "search-page",

  type: "search",

  rules: [
    {
      id: "rule-1",
      value: "陈远",
      targetPage: "chen"
    },

    {
      id: "rule-2",
      value: "0717",
      targetPage: "case"
    }
  ]
}
```

---

# 16. HTML Generator

Generator 的职责：

```text
Blueprint Project
       ↓
读取页面节点
       ↓
读取 Template
       ↓
填入 Content
       ↓
读取 Outputs / Rules
       ↓
生成跳转 JS
       ↓
生成 HTML
```

---

## 16.1 Browse 生成示例

Blueprint：

```text
案件详情
├─ 居民采访 → interview
└─ 返回首页 → home
```

输出：

```html
<a href="interview.html">居民采访</a>
<a href="index.html">返回首页</a>
```

---

## 16.2 Search 生成示例

规则：

```text
陈远 → chen.html
0717 → case.html
```

生成少量 JS：

```js
const routes = {
  "陈远": "chen.html",
  "0717": "case.html"
};

form.addEventListener("submit", event => {
  event.preventDefault();

  const keyword = input.value.trim();

  if (routes[keyword]) {
    location.href = routes[keyword];
  } else {
    result.textContent = "没有找到相关结果";
  }
});
```

---

## 16.3 Login

生成：

```js
if (password.value === "0717") {
  location.href = "archive.html";
} else {
  error.textContent = "密码错误";
}
```

---

# 17. Preview

## 17.1 功能

Toolbar：

> ▶ Preview

点击以后：

- 编译当前 Blueprint
- 打开游戏预览
- 默认从 Start Page 开始

---

## 17.2 Start Page

必须指定一个节点：

```text
Set as Start Page
```

节点出现：

> ▶ START

例如：

```text
▶ 百度搜索
```

Build 时输出为：

```text
index.html
```

或者允许其原 filename 保留，并额外生成入口。

MVP 建议：

> Start Page 强制生成 `index.html`

以降低部署复杂度。

---

# 18. Build 验证

点击 Build 前自动检查。

错误示例：

### 无入口

> ❌ No Start Page

### Filename 重复

> ❌ `case.html` is used twice.

### 链接未连接

> ⚠️ “警方通报”没有目标页面。

### Login 无成功出口

> ❌ Login Page has no success target.

### Search 无规则

> ⚠️ Search Page has no search rules.

错误应尽量使用新手可理解的语言，而不是技术错误堆栈。

---

# 19. Export

MVP 提供：

> **Export Project**

生成：

```text
my-arg/
├── index.html
├── case.html
├── archive.html
├── ending.html
│
├── css/
│   └── shared.css
│
├── js/
│   └── game.js
│
└── assets/
```

第一版若时间/额度不足，可以：

> 直接下载各 HTML 文件

ZIP Export 可以作为第二优先级。

---

# 20. 模板文件结构

长期建议：

```text
templates/
├── browse/
│   ├── news-2001/
│   │   ├── template.json
│   │   ├── template.html
│   │   ├── style.css
│   │   └── preview.png
│   │
│   └── bbs-thread/
│
├── search/
├── index/
├── login/
├── files/
└── ending/
```

---

# 21. Template Definition

例如：

```json
{
  "id": "news-2001",
  "name": "2001地方新闻",
  "type": "browse",

  "fields": [
    {
      "key": "siteName",
      "label": "网站名称",
      "type": "text"
    },
    {
      "key": "title",
      "label": "新闻标题",
      "type": "text"
    },
    {
      "key": "body",
      "label": "正文",
      "type": "textarea"
    }
  ]
}
```

模板：

```html
<h1>{{siteName}}</h1>

<h2>{{title}}</h2>

<div class="article">
  {{body}}
</div>

<div class="links">
  {{ARG_LINKS}}
</div>
```

---

# 22. 技术方案

## 编辑器

建议：

```text
React
Vite
@xyflow/react
```

### React

负责：

- UI
- Inspector
- 项目状态
- 模板选择
- Preview

### React Flow

负责：

- Node
- Edge
- 拖动
- 连线
- 缩放
- Canvas

---

## 导出游戏

只生成：

```text
HTML
CSS
Vanilla JavaScript
```

禁止默认生成：

```text
React
Vue
Node runtime
```

---

# 23. 状态管理

MVP 不引入 Redux / Zustand 等额外库也可以。

项目状态规模很小，可以使用：

```text
React useState
+
Context（必要时）
```

若后续项目复杂，再考虑 Zustand。

---

# 24. 本地保存

如果开发成本允许：

```text
localStorage
```

保存：

```text
Project JSON
```

让用户刷新编辑器不会丢失当前 Blueprint。

但优先级低于：

> Preview / Generate

---

# 25. MVP 页面模板数量

为了避免模板开发耗尽时间，第一版建议：

## Search

2 个：

- 简洁旧搜索
- 2000s 搜索门户

## Index

2 个：

- 门户首页
- 档案目录

## Browse

3 个：

- 新闻
- BBS
- 普通文档

## Login

2 个：

- Admin Login
- Forum Login

## Files

1 个：

- Windows / FTP 风格目录

## Ending

2 个：

- Black Ending
- System Error

总计：

> **12 个模板左右**

如果 Code 额度非常紧，第一版先每种类型 1 个，总计 6 个。

---

# 26. MVP 用户流程

## Step 1

打开 ARG Blueprint。

---

## Step 2

拖入：

```text
Search
Browse
Login
Ending
```

---

## Step 3

选择模板。

例如：

```text
Search
→ 2000s Search
```

---

## Step 4

编辑内容。

---

## Step 5

设置 Search：

```text
Keyword:
常青苑

Target:
News
```

---

## Step 6

设置 Login：

```text
Password:
0717

Target:
Ending
```

---

## Step 7

连线。

最终：

```text
                     “常青苑”
Search ─────────────────────→ News
 │
 │ password 0717
 │
 └──────────────────────────→ Ending
```

---

## Step 8

Preview。

---

## Step 9

Export。

---

## Step 10

上传静态网站。

---

# 27. Demo 项目

产品开发完成后必须自带：

> **Example: 0717**

流程：

```text
                    搜索“常青苑”
                   ┌─────────────→ News
                   │
Search ─────────────┤
                   │
                   │ 密码“0717”
                   └─────────────→ Ending
```

主要用于：

- README
- 教学视频
- 自动测试
- Demo 展示

---

# 28. 后续版本规划

## V0.2 — Creator

增加：

- 更多模板
- 修改颜色 / Logo
- 图片上传
- JSON 导入导出
- ZIP Export
- 项目保存
- Clone Page
- Start Page
- Better Preview

---

## V0.3 — ARG Logic

增加：

```text
变量
条件
页面访问次数
刷新次数
停留时间
```

例如：

```text
refreshCount >= 3
→ photo2
```

---

## V0.4 — Custom Templates

支持：

> Import Template

用户可以自己提供：

```text
template.html
style.css
template.json
```

实现社区模板生态。

---

## V0.5 — Advanced ARG

可选加入：

- Audio Trigger
- Video Trigger
- File Download
- localStorage 状态
- URL 参数
- Hidden Element
- Source Code Puzzle
- Dynamic Image
- 多结局

---

## V1.0 — AI Assisted

AI 不直接生成整套代码。

推荐路径：

```text
用户描述剧情
       ↓
AI 生成 Blueprint 草稿
       ↓
用户人工修改
       ↓
ARG Blueprint
       ↓
HTML
```

例如：

> “玩家从搜索引擎开始，搜索常青苑进入新闻；新闻中找到密码0717，进入档案系统；最后阅读隐藏档案通关。”

AI 自动产生：

```text
Search
  ↓
News
  ↓
Login
  ↓
Archive
  ↓
Ending
```

---

# 29. 开源策略

建议开源。

仓库：

```text
arg-blueprint/
├── src/
├── templates/
├── examples/
├── docs/
└── README.md
```

模板尤其适合社区贡献。

例如贡献者只需要提交：

```text
templates/browse/newspaper-1998/
```

而无需理解整个 Blueprint 编辑器。

---

# 30. 产品核心价值

ARG Blueprint 不应该变成：

> 又一个 AI 网站生成器。

它真正解决的问题是：

> **ARG 作者思考的是剧情流程，而浏览器要求的是 HTML 和 JavaScript。**

ARG Blueprint 做的事情，就是把两者之间的翻译自动完成：

```text
剧情思维导图
        ↓
   ARG Blueprint
        ↓
页面与触发逻辑
        ↓
HTML + CSS + JS
        ↓
可以玩的 ARG
```

最终产品理念：

> **先画故事，再生成网页。**

对于完全不会代码的人：

> 让他能够完成第一款 ARG。

对于会 Vibe Coding 的人：

> 让 Agent 不必从零搭结构。

对于有开发经验的人：

> 让大量重复的页面和剧情跳转逻辑自动化。

---

# 31. MVP 最终 Definition of Done

只有满足以下条件才算 MVP 完成：

- [ ] 可以创建 Search 页面
- [ ] 可以创建 Index 页面
- [ ] 可以创建 Browse 页面
- [ ] 可以创建 Login 页面
- [ ] 可以创建 Files 页面
- [ ] 可以创建 Ending 页面
- [ ] 每种 Page Type 至少有一个 Template
- [ ] 页面节点可以拖动
- [ ] 页面之间可以连接
- [ ] Browse / Index / Files 支持多个出口
- [ ] Search 支持关键词匹配
- [ ] Login 支持密码匹配
- [ ] 可以修改页面基本文字内容
- [ ] 可以指定 Start Page
- [ ] 可以 Preview
- [ ] 可以生成多个 HTML 文件
- [ ] 生成结果只依赖 HTML / CSS / Vanilla JS
- [ ] 生成项目无需 ARG Blueprint 即可独立运行
- [ ] 示例项目 `0717` 可以完整通关

**只要以上完成，就停止增加功能，发布 V0.1。**