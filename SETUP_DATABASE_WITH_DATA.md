# Complete Database Setup with Sample Data

## Problem
Your admin panel shows "No Users Found" and "No Establishments" because the database is empty.

## Solution - Step by Step

### Step 1: Run the Sample Data Script

**Option A: Using the batch file (Easiest)**
```bash
# Just double-click this file:
run-sample-data.bat
```

**Option B: Using psql directly**
```bash
cd database
psql -U postgres -d opennova -f 99_sample_data.sql
```

**Option C: Using pgAdmin**
1. Open pgAdmin
2. Connect to `opennova` database
3. Open Query Tool
4. Open file `database/99_sample_data.sql`
5. Click Execute (F5)

### Step 2: Verify Data Was Loaded

Run the check script:
```bash
check-database.bat
```

You should see:
- Total users: 8 or more
- Total establishments: 6 or more

### Step 3: Restart Backend Server

**IMPORTANT:** You must restart the backend for changes to take effect!

```bash
# Stop the current backend (Ctrl+C)
cd backend
mvn spring-boot:run
```

### Step 4: Refresh Admin Panel

1. Go to http://localhost:3000/admin
2. Login: abishekopennova@gmail.com / abi@1234
3. Click "User Management" - should show 8+ users
4. Click "Establishments" - should show 6+ establishments

## What the Sample Data Includes

### Users (8 total)
| Name | Email | Role | Status |
|------|-------|------|--------|
| John Doe | john.doe@example.com | USER | Active |
| Jane Smith | jane.smith@example.com | USER | Active |
| Mike Wilson | mike.wilson@example.com | USER | Active |
| Sarah Johnson | sarah.johnson@example.com | USER | Active |
| David Brown | david.brown@example.com | USER | Inactive |
| Emily Davis | emily.davis@example.com | USER | Active |
| Robert Miller | robert.miller@example.com | USER | Active |
| Lisa Anderson | lisa.anderson@example.com | USER | Active |

**Password for all:** `abi@1234`

### Establishments (6 total)
| Name | Type | City | Owner |
|------|------|------|-------|
| Grand Hotel Karur | HOTEL | Karur | Hotel Owner |
| Royal Palace Hotel | HOTEL | Karur | Hotel Owner |
| City Hospital Namakkal | HOSPITAL | Namakkal | Hospital Owner |
| Care Hospital | HOSPITAL | Namakkal | Hospital Owner |
| Modern Shop Salem | SHOP | Salem | Shop Owner |
| Fashion Hub | SHOP | Salem | Shop Owner |

## Troubleshooting

### "Database opennova does not exist"
Create it first:
```bash
psql -U postgres -c "CREATE DATABASE opennova;"
```
Then run all migrations before sample data.

### "Owner not found" error
The sample data script expects these owner accounts to exist:
- abishekpalanivel212@gmail.com (Hotel Owner)
- abishekpopennova@gmail.com (Hospital Owner)
- mithunpopennova@gmail.com (Shop Owner)

If they don't exist, register them first through the app.

### Still showing empty after running script
1. Check if script ran successfully (look for success message)
2. Verify data exists:
   ```bash
   check-database.bat
   ```
3. **Restart backend server** (most common issue!)
4. Clear browser cache
5. Check browser console for errors (F12)

### Backend shows errors
Check backend console for:
- Database connection errors
- Authentication errors
- SQL errors

Common fixes:
- Ensure PostgreSQL is running
- Check database credentials in `application.properties`
- Verify database name is `opennova`

## Manual Verification

If you want to check manually in psql:

```sql
-- Connect to database
psql -U postgres -d opennova

-- Check users
SELECT COUNT(*) FROM users;
SELECT id, email, full_name, role FROM users;

-- Check establishments
SELECT COUNT(*) FROM establishments;
SELECT id, name, type, owner_id FROM establishments;

-- Exit
\q
```

## Important Notes

1. **Always restart backend** after loading data
2. The script is safe to run multiple times (uses `ON CONFLICT DO NOTHING`)
3. Sample data is for development only - don't use in production
4. All test users have password: `abi@1234`

## Still Not Working?

If data still doesn't show after following all steps:

1. Check backend console logs for errors
2. Check browser console (F12) for API errors
3. Verify you're logged in as admin
4. Try logging out and back in
5. Check if backend is actually running on port 9000

## Quick Test

Open browser console (F12) and run:
```javascript
fetch('http://localhost:9000/api/admin/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
```

This should return the list of users if everything is working.
