@echo off
chcp 65001 >nul
title ARG Blueprint - 交互式解谜剧本引擎一键启动器

echo ======================================================================
echo           🎮 ARG Blueprint (另类实境游戏/拟真解谜剧本引擎)
echo ======================================================================
echo.

:: 1. 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [❌ 错误] 未检测到 Node.js 环境！
    echo.
    echo 💡 小白极速解决指南：
    echo 1. 请前往官网下载并安装 Node.js LTS 稳定版：
    echo    👉 https://nodejs.org/
    echo 2. 安装时一路点击 [Next] 下一步即可。
    echo 3. 安装完成后，重新双击运行本脚本即可！
    echo.
    pause
    exit /b 1
)

node -e "const [major, minor, patch] = process.versions.node.split('.').map(Number); const supported = (major === 20 ^&^& (minor ^> 19 ^|^| (minor === 19 ^&^& patch ^>= 0))) ^|^| (major === 22 ^&^& (minor ^> 12 ^|^| (minor === 12 ^&^& patch ^>= 0))) ^|^| major ^> 22; process.exit(supported ? 0 : 1)"
if %errorlevel% neq 0 (
    echo [❌ 错误] 当前 Node.js 版本不受支持：
    node -v
    echo 💡 请安装 Node.js 20.19+ 或 22.12+（推荐当前 LTS），然后重新运行本脚本。
    pause
    exit /b 1
)

echo [✔] Node.js 版本检测正常:
node -v
echo.

:: 2. 检查依赖 node_modules 是否存在
if not exist "node_modules\" (
    echo [📦 正在安装依赖包...] 初次运行可能需要 10-30 秒，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo [❌ 错误] npm install 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
    echo [✔] 依赖安装完成！
    echo.
)

:: 3. 提示并自动在默认浏览器中打开页面
echo [🚀 正在启动本地开发服务器...]
echo.
echo 🌐 浏览器访问地址: http://localhost:5173/
echo 💡 提示：按 [Ctrl + C] 可停止服务。
echo.

:: 延迟 1.5 秒后自动打开浏览器
start "" http://localhost:5173/

:: 4. 启动 Vite 开发服务
npm run dev
pause
