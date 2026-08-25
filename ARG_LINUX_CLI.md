# 🐧 ARG Blueprint Linux 终端命令 (CLI) 手册

ARG Blueprint 现已内置全功能 Linux 风格交互式终端（CLI 控制台）。你可以通过键盘输入标准 Shell 指令，或者批量执行 `.sh` 脚本来高速创建页面、建立路由跳转、配置密码与搜索规则！

---

## 🚀 唤起终端方式
1. 点击编辑器顶栏的 **`❯_ 终端`** 按键。
2. 点击右下角悬浮工具栏中的 **`❯_ 终端`**。
3. 按全局快捷键 **`Ctrl + \``**（反引号）。

---

## 🛠️ Linux 指令全集

### 1. `touch` / `mkpage`（创建页面节点）
```bash
# 创建桌面起始页并指定系统名称
touch desktop -t Desktop -n "🖥️ 电脑桌面" --template "Windows XP 桌面" --start

# 创建聊天页并指定微信模板
touch chat -t Chat -n "💬 微信聊天" --template "微信 UI 风格"

# 创建搜索引擎、密码锁与结局页
touch search -t Search -n "🔍 全网搜索引擎" --template "经典搜索"
touch login -t Login -n "🔐 密码终端" --template "后台登录"
touch files -t Files -n "📁 机密卷宗"
touch doc_case -t Browse -n "📰 案件日记"
touch ending_true -t Ending -n "🎬 真相大白"
```
- 参数说明：
  - `-t, --type <Type>`：页面类型（`Desktop`, `Chat`, `Search`, `Login`, `Files`, `Browse`, `Index`, `Ending`）
  - `-n, --name "<名称>"`：卡片名称
  - `--template "<模板名>"`：指定内置模板
  - `--start`：设为游戏起始页（导出为 `index.html`）

---

### 2. `ln`（建立页面路由连线与按键）
```bash
# 桌面图标连线
ln desktop chat -p "微信.exe" --icon "💬"
ln desktop search -p "全盘搜索.exe" --icon "🔍"
ln desktop login -p "机密文件夹" --icon "🔐"

# 登录成功后流转到文件夹
ln login files

# 文件夹内文档流转
ln files ending_true -p "提交结案报告.doc" --icon "📄"
```
- 参数说明：
  - `-p, --port "<按键名>"`：桌面图标名称或导航按键标题
  - `--icon "<emoji/图标>"`：桌面图标显示符号

---

### 3. `unlink` / `rmlink`（断开连线）
```bash
unlink desktop chat
```

---

### 4. `rm`（删除页面节点）
```bash
rm chat
```

---

### 5. `set` / `config`（设置页面属性/密码）
```bash
# 设置密码锁的密码
set login password="0717" systemName="机密档案终端"

# 设置桌面备忘录与主机名
set desktop systemName="温水青的主机" stickyNote="备忘：查看 0717 卷宗"

# 设置搜索引擎提示语
set search notice="💡 提示：输入 0717 提取线索"
```

---

### 6. `rule` / `rmrule`（搜索引擎关键词规则）
```bash
# 增加关键词规则：搜索 "0717" 跳转至 doc_case
rule search "0717" doc_case
rule search "延盛岛" news_island

# 删除某个关键词
rmrule search "延盛岛"
```

---

### 7. `contact` / `msg` / `choice`（聊天对话与分支配置）
```bash
# 添加联系人
contact chat "林警官" --avatar "👮" --bio "刑侦支队"

# 添加 NPC 对话
msg chat "林警官" npc "水青，我们在现场找到了一组日记。"
msg chat "林警官" player "密码是什么？"

# 添加玩家分支选项与回复
choice chat "林警官" "询问密码线索" login --reply "密码是案发年份【0717】"
choice chat "林警官" "前往全网搜索" search
```

---

### 8. `start`（设定起始页）
```bash
start desktop
```

---

### 9. `ls` / `cat` / `stat`（查看状态）
```bash
# 简略列出所有节点
ls

# 详细表格列出所有节点、类型与连线
ls -l

# 查看特定页面节点的详细配置
cat desktop
cat login
```

---

### 10. `mv`（重命名节点 ID）
```bash
mv page1 intro_page
```

---

### 11. `clear`（清屏）
```bash
clear
```

---

## 📜 批量脚本运行 (Shell Batch Script)

点击终端顶部的 **`📜 批量脚本`**，直接粘贴一段完整的 Shell 脚本，一键构建完整游戏：

```bash
touch desktop -t Desktop -n "🖥️ 调查员电脑桌面" --start
touch chat -t Chat -n "💬 微信聊天软件" --template "微信 UI 风格"
touch search -t Search -n "🔍 全网搜索引擎" --template "经典搜索"
touch login -t Login -n "🔐 机密档案密码锁" --template "后台登录"
touch files -t Files -n "📁 机密卷宗文件夹"
touch doc_case -t Browse -n "📰 新闻：0717 特大案"
touch ending_true -t Ending -n "🎬 结局 · 真相大白"

ln desktop chat -p "微信.exe" --icon "💬"
ln desktop search -p "全盘搜索.exe" --icon "🔍"
ln desktop login -p "机密文件夹" --icon "🔐"

set login password="0717"
rule search "0717" doc_case

contact chat "林警官" --avatar "👮" --bio "刑侦支队"
msg chat "林警官" npc "水青，我们在现场找到了一组加密日记。"
choice chat "林警官" "询问密码" login --reply "密码是【0717】"

ln login files
ln files ending_true -p "提交结案报告.doc" --icon "📄"
```

---

## ⌨️ 终端操作快捷键
- **`Enter`**：执行命令
- **`⬆ / ⬇`**：切换上一条 / 下一条历史命令
- **`Tab`**：自动补全指令名称与节点 ID
- **`Ctrl + \``**：快速唤起 / 收起终端
