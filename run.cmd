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
REM ����д�NodeJs����
TASKKILL /IM node_32.exe /F
TASKKILL /IM node_64.exe /F
TASKKILL /IM node.exe /F

REM �����ļ���׺��ֻѹ�� js �� css
if "%~x1" NEQ ".js" (
	echo.
	echo **** ��ѡ�� JS �ļ�
	echo.
	goto End
)
REM �жϲ���ϵͳ�Ƿ�Ϊ32λ
if "%PROCESSOR_ARCHITECTURE%" == "X86" (
    set Node = node_32.exe
) else (
    set Node = node_64.exe
)
echo "%Node%"
pause

REM ��������webdriver
REM cd selenium.server
REM start /min start.cmd
REM cd ..

REM �ж��Ƿ�Ϊ����ģʽ
echo %~nx1|find "_debug">nul&&set debug=true

REM �������Ŀ¼
PUSHD "%~dp0"
REM ����nodeJSִ�нű�
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

REM ����д�F2ETest����

pause
TASKKILL /IM cmd.exe /FI "WINDOWTITLE eq F2ETest*"
