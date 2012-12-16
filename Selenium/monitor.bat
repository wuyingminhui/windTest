@echo off
:loop
for /f "tokens=1" %%i in ('tasklist^|find "java.exe"') do set var=%%i 
if not defined var cmd.exe /C start.cmd
ping 127.0.0.1 -n 10>nul
goto :loop