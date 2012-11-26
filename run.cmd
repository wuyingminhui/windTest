@echo off
REM =====================================
REM    F2ETest CMD Script
REM
REM     - by shenmao1989@gmail.com
REM     - 2012-11-20 16:08:29
REM =====================================
SETLOCAL ENABLEEXTENSIONS

echo.
title F2ETest v0.1
REM 清理残存NodeJs进程
TASKKILL /IM node_32.exe /F
TASKKILL /IM node_64.exe /F
TASKKILL /IM node.exe /F

REM 过滤文件后缀，只压缩 js 和 css
if "%~x1" NEQ ".js" (
	echo.
	echo **** 请选择 JS 文件
	echo.
	goto End
)
REM 判断操作系统是否为32位
if "%PROCESSOR_ARCHITECTURE%" == "X86" (
    set Node = node_32.exe
) else (
    set Node = node_64.exe
)
echo "%Node%"
pause

REM 启动本地webdriver
REM cd selenium.server
REM start /min start.cmd
REM cd ..

REM 判断是否为调试模式
echo %~nx1|find "_debug">nul&&set debug=true

REM 进入程序目录
PUSHD "%~dp0"
REM 调用nodeJS执行脚本
if "%debug%" == "true" (
    start /min nodeJS\node.exe "node_modules\node-inspector\bin\inspector.js"
    start chrome.exe "http://127.0.0.1:8080/debug?port=5858"
    "nodeJS\node.exe" "--debug-brk" "core/init.js" "%~nx1"
) else (
    "nodeJS\node.exe" "core/init.js" "%~nx1"
)
POPD
goto End

:End
ENDLOCAL

REM 清理残存F2ETest进程

pause
TASKKILL /IM cmd.exe /FI "WINDOWTITLE eq F2ETest*"
