@echo off
echo Creating wedding_budget database...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE wedding_budget;"
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist or there was an error.
)
pause
