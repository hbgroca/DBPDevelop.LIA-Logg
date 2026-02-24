@echo off
echo Installerar frontend-paket...
call npm install
if %errorlevel% neq 0 (
    echo Fel vid installation av frontend-paket.
    pause
    exit /b 1
)

echo.
echo Installerar backend-paket...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Fel vid installation av backend-paket.
    pause
    exit /b 1
)
cd ..

echo.
echo Skapar nödvändiga mappar och filer...
if not exist "public\images" (
    mkdir "public\images"
    echo Skapade public\images
)
if not exist "public\data.json" (
    echo [] > "public\data.json"
    echo Skapade public\data.json
)

echo.
echo Installation klar! Starta appen med _startBackend.bat och _startFrontend.bat.
pause
