@ECHO OFF
REM ================= �ж�Windows�汾 ============================
REM ����ֵ: isXPlevel=1 XP����;isXPlevel=2 ����XP����;isXPlevel=0 ����XP����
:isWindowsVer
ver|findstr "5\.[0-9]\.[0-9][0-9]*">nul&&(set isXPlevel=1&goto:start)
ver|findstr "6\.[0-9]\.[0-9][0-9]*">nul&&(set isXPlevel=2&goto:start)
set isXPlevel=0
:start
REM ================= �жϽ��� ===================================
REM ����� ����winxp���� ��Ҫ�ж��Ƿ����ԱȨ��
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
echo û�й���ԱȨ�ޣ����Ҽ��Թ���Ա�������
goto End

:Success
echo ��װ�ɹ�
goto End

:End
pause
REM exit
