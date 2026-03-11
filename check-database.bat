@echo off
echo ========================================
echo   OpenNova - Database Status Check
echo ========================================
echo.

set PGPASSWORD=abi@1234

echo Checking database contents...
echo.

psql -U postgres -h localhost -p 5432 -d opennova -c "SELECT COUNT(*) as total_users FROM users;"
echo.

psql -U postgres -h localhost -p 5432 -d opennova -c "SELECT COUNT(*) as total_establishments FROM establishments;"
echo.

psql -U postgres -h localhost -p 5432 -d opennova -c "SELECT id, email, full_name, role, is_active FROM users ORDER BY id LIMIT 10;"
echo.

psql -U postgres -h localhost -p 5432 -d opennova -c "SELECT id, name, type, status FROM establishments ORDER BY id LIMIT 10;"
echo.

pause
