@ECHO OFF
REM ================= 判断Windows版本 ============================
REM 返回值: isXPlevel=1 XP级别;isXPlevel=2 高于XP级别;isXPlevel=0 低于XP级别
:isWindowsVer
ver|findstr "5\.[0-9]\.[0-9][0-9]*">nul&&(set isXPlevel=1&goto:start)
ver|findstr "6\.[0-9]\.[0-9][0-9]*">nul&&(set isXPlevel=2&goto:start)
set isXPlevel=0
:start
REM ================= 判断结束 ===================================
REM 如果是 高于winxp级别 需要判断是否管理员权限
if %isXPlevel% == 2 (
    set uac=0
    bcdedit>nul
    if errorlevel 1 (
        goto Error
    )
)

pushd "%~dp0"
rundll32 setupapi.dll,InstallHinfSection DefaultInstall 128 .\install.inf
popd
goto Success

:Error
echo 没有管理员权限，请右键以管理员身份运行
goto End

:Success
echo 安装成功
goto End

:End
pause
REM exit
