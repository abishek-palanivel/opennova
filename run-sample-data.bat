@echo off
echo ========================================
echo   OpenNova - Loading Sample Data
echo ========================================
echo.

set PGPASSWORD=abi@1234

echo [1/2] Checking database connection...
psql -U postgres -h localhost -p 5432 -d opennova -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database 'opennova'
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database 'opennova' exists
    echo   3. Password is correct (abi@1234)
    pause
    exit /b 1
)
echo Database connection successful ✓
echo.

echo [2/2] Loading sample data...
cd database
psql -U postgres -h localhost -p 5432 -d opennova -f 99_sample_data.sql
cd ..

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Sample Data Loaded Successfully!
    echo ========================================
    echo.
    echo Now you should see:
    echo   - 8+ users in User Management
    echo   - 6+ establishments in Manage Establishments
    echo.
    echo Please restart your backend server and refresh the admin panel.
    echo.
) else (
    echo.
    echo ERROR: Failed to load sample data
    echo Check the error messages above
    echo.
)

pause
