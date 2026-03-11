# Fix Empty Data in Admin Panel

## Problem
The Admin Panel shows "No Users Found" and "No Establishments" because the database is empty.

## Solution
Run the sample data SQL script to populate your database with test data.

## Steps to Fix

### Using Command Line (psql)

```bash
# Navigate to database folder
cd database

# Run the sample data script
psql -U postgres -d opennova -f 99_sample_data.sql
```

### Using pgAdmin

1. Open pgAdmin
2. Connect to your `opennova` database
3. Open Query Tool (Tools > Query Tool)
4. Open file `database/99_sample_data.sql`
5. Click Execute (F5)

## What This Does

The script will add:

### Users (8 total)
- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com)
- Mike Wilson (mike.wilson@example.com)
- Sarah Johnson (sarah.johnson@example.com)
- David Brown (david.brown@example.com) - Inactive
- Emily Davis (emily.davis@example.com)
- Robert Miller (robert.miller@example.com)
- Lisa Anderson (lisa.anderson@example.com)

**Password for all test users:** `abi@1234`

### Establishments (6 total)
- Grand Hotel Karur (Hotel)
- Royal Palace Hotel (Hotel)
- City Hospital Namakkal (Hospital)
- Care Hospital (Hospital)
- Modern Shop Salem (Shop)
- Fashion Hub (Shop)

## Verify It Worked

1. Restart your backend server (if running)
2. Login to admin panel: http://localhost:3000/admin
   - Email: abishekopennova@gmail.com
   - Password: abi@1234
3. Click on "User Management" - you should see 8+ users
4. Click on "Establishments" - you should see 6+ establishments

## Troubleshooting

### Script fails with "owner not found"
This means your owner accounts don't exist yet. First:
1. Register the owner accounts through the app
2. Or manually insert them in the database
3. Then run the sample data script

### Still showing empty
1. Check if script ran successfully (look for success message)
2. Verify data in database:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM establishments;
   ```
3. Restart backend server
4. Clear browser cache and refresh

### Duplicate key errors
The script is safe to run multiple times. It uses `ON CONFLICT DO NOTHING` to skip existing records.

## For Production

**DO NOT** run `99_sample_data.sql` in production! This is only for development/testing.

For production:
- Users will register through the app
- Owners will create establishments through the owner portal
- Admin will approve establishment requests
