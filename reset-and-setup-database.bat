@echo off
echo ========================================
echo   OpenNova - Complete Database Reset
echo ========================================
echo.
echo WARNING: This will DELETE all existing data!
echo.
set /p confirm="Are you sure? Type YES to continue: "
if not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

set PGPASSWORD=abi@1234

echo.
echo [1/4] Dropping existing database...
psql -U postgres -h localhost -p 5432 -c "DROP DATABASE IF EXISTS opennova;"
echo.

echo [2/4] Creating fresh database...
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE opennova;"
echo.

echo [3/4] Running all migrations...
cd database
psql -U postgres -h localhost -p 5432 -d opennova -f 01_schema.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 03_constraints.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 04_user_columns.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 05_menu_columns.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 06_weekly_schedule.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 07_file_uploads.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 08_review_approval_system.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 10_chat_system.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 11_add_collection_description.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 12_add_upi_qr_code.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 14_fix_user_roles.sql
psql -U postgres -h localhost -p 5432 -d opennova -f 15_add_login_attempt_tracking.sql
echo.

echo [4/4] Loading sample data...
psql -U postgres -h localhost -p 5432 -d opennova -f 99_sample_data.sql
cd ..
echo.

echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your backend server
echo 2. Go to http://localhost:3000/admin
echo 3. Login and check User Management
echo.
pause
