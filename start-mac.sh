#!/bin/bash

# ARG Blueprint 一键启动脚本 (macOS & Linux)
# 设置遇到错误时友好提示

echo "======================================================================"
echo "          🎮 ARG Blueprint (另类实境游戏/拟真解谜剧本引擎)"
echo "======================================================================"
echo ""

# 获取脚本所在目录，切换至项目根目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[❌ 错误] 未检测到 Node.js 环境！"
    echo ""
    echo "💡 小白极速解决指南："
    echo "1. 访问 Node.js 官网下载 macOS 安装包 (.pkg)："
    echo "   👉 https://nodejs.org/"
    echo "2. 或者使用 Homebrew 安装："
    echo "   brew install node"
    echo "3. 安装完成后，重新运行本脚本即可！"
    echo ""
    exit 1
fi

if ! node -e "const [major, minor, patch] = process.versions.node.split('.').map(Number); const supported = (major === 20 && (minor > 19 || (minor === 19 && patch >= 0))) || (major === 22 && (minor > 12 || (minor === 12 && patch >= 0))) || major > 22; process.exit(supported ? 0 : 1)"; then
    echo "[❌ 错误] 当前 Node.js $(node -v) 不受支持。"
    echo "💡 请安装 Node.js 20.19+ 或 22.12+（推荐当前 LTS），然后重新运行本脚本。"
    exit 1
fi

echo "[✔] Node.js 版本检测正常: $(node -v)"
echo ""

# 2. 检查依赖
if [ ! -d "node_modules" ]; then
    echo "[📦 正在安装依赖包...] 初次运行可能需要 10-30 秒，请稍候..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[❌ 错误] npm install 依赖安装失败，请检查网络后重试。"
        exit 1
    fi
    echo "[✔] 依赖安装完成！"
    echo ""
fi

# 3. 自动在默认浏览器中打开页面
echo "[🚀 正在启动本地开发服务器...]"
echo "🌐 浏览器访问地址: http://localhost:5173/"
echo "💡 提示：按 [Ctrl + C] 可停止服务。"
echo ""

# 延迟在后台打开浏览器
(sleep 1.5 && (which open > /dev/null && open http://localhost:5173/ || which xdg-open > /dev/null && xdg-open http://localhost:5173/)) &

# 4. 启动 Vite 开发服务
npm run dev
