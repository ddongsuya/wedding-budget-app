@echo off
echo ========================================
echo Wedding Budget App - Backend Setup
echo ========================================
echo.

echo Step 1: Creating database...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE wedding_budget;" 2>nul
if %errorlevel% equ 0 (
    echo [OK] Database created successfully!
) else (
    echo [INFO] Database might already exist - continuing...
)
echo.

echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed!
echo.

echo Step 3: Running database migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)
echo [OK] Migrations completed!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the backend server, run:
echo   npm run dev
echo.
pause
