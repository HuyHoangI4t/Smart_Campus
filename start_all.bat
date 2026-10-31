@echo off
chcp 65001 >nul
title KHOI DONG HE THONG SMART CAMPUS

echo Dang khoi dong 3 tab trong Windows Terminal...

:: Mo 3 tab doc lap trong cung 1 cua so Windows Terminal
start wt.exe new-tab --title "BACKEND" -d "%~dp0backend" cmd /k "npm run dev" ; new-tab --title "ADMIN" -d "%~dp0admin" cmd /k "npm start" ; new-tab --title "FRONTEND EXPO" -d "%~dp0frontend" cmd /k "npx expo start --go"

echo.
echo ======================================================================
echo  DA KHOI DONG THANH CONG!
echo ======================================================================
echo.
pause >nul