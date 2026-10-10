@echo off
chcp 65001 >nul
title KHOI DONG HE THONG SMART CAMPUS

echo ======================================================================
echo          HE THONG SMART CAMPUS - DAI HOC TAY NGUYEN
echo ======================================================================
echo.
echo [1/3] Dang khoi dong BACKEND SERVER (Port 5000)...
start "BACKEND API (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/3] Dang khoi dong ADMIN PORTAL (Port 5001)...
start "ADMIN PORTAL (Port 5001)" cmd /k "cd /d "%~dp0admin" && npm start"

timeout /t 2 /nobreak >nul

echo [3/3] Dang khoi dong FRONTEND EXPO APP (Metro Bundler)...
start "FRONTEND APP (Expo)" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ======================================================================
echo  DA KHOI DONG THANH CONG CA 3 HE THONG!
echo.
echo  * Swagger Docs:    http://localhost:5000/api-docs
echo  * Admin Portal:    http://localhost:5001
echo  * Mobile App:      Quet ma QR tren cua so Expo bang Expo Go
echo ======================================================================
echo.
echo Nhan phim bat ky hoac dong cua so nay (3 service van tiep tuc chay).
pause >nul

