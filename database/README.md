# OpenNova Database Setup

## Quick Setup

### Option 1: Using psql (Recommended)

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE opennova;"

# 2. Run all migrations in order
cd database
psql -U postgres -d opennova -f 01_schema.sql
psql -U postgres -d opennova -f 03_constraints.sql
psql -U postgres -d opennova -f 04_user_columns.sql
psql -U postgres -d opennova -f 05_menu_columns.sql
psql -U postgres -d opennova -f 06_weekly_schedule.sql
psql -U postgres -d opennova -f 07_file_uploads.sql
psql -U postgres -d opennova -f 08_review_approval_system.sql
psql -U postgres -d opennova -f 10_chat_system.sql
psql -U postgres -d opennova -f 11_add_collection_description.sql
psql -U postgres -d opennova -f 12_add_upi_qr_code.sql
psql -U postgres -d opennova -f 14_fix_user_roles.sql
psql -U postgres -d opennova -f 15_add_login_attempt_tracking.sql

# 3. Insert sample data (IMPORTANT!)
psql -U postgres -d opennova -f 99_sample_data.sql
```

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Create database named `opennova`
3. Open Query Tool
4. Run each SQL file in order (01, 03, 04, 05, 06, 07, 08, 10, 11, 12, 14, 15)
5. Finally run `99_sample_data.sql` to populate with test data

## Migration Files

| File | Description |
|------|-------------|
| `01_schema.sql` | Core database schema with all tables |
| `03_constraints.sql` | Data validation constraints |
| `04_user_columns.sql` | User table enhancements |
| `05_menu_columns.sql` | Menu system improvements |
| `06_weekly_schedule.sql` | Weekly schedule management |
| `07_file_uploads.sql` | File upload support |
| `08_review_approval_system.sql` | Review moderation |
| `10_chat_system.sql` | Chat messaging |
| `11_add_collection_description.sql` | Collection descriptions |
| `12_add_upi_qr_code.sql` | UPI QR code support |
| `14_fix_user_roles.sql` | User role fixes |
| `15_add_login_attempt_tracking.sql` | Account security |
| `99_sample_data.sql` | Sample data for testing |

## Sample Data

The `99_sample_data.sql` file includes:

- **8 sample users** (John Doe, Jane Smith, Mike Wilson, etc.)
- **6 sample establishments** (2 hotels, 2 hospitals, 2 shops)
- **Weekly schedules** for all establishments
- **Collections** for payment tracking

**Important:** The sample data uses BCrypt hashed password `abi@1234` for all test users.

## Database Configuration

Default credentials (from `application.properties`):
- **Database**: opennova
- **Host**: localhost:5432
- **Username**: postgres
- **Password**: abi@1234

## Troubleshooting

### No data showing in admin panel?

Run the sample data script:
```bash
psql -U postgres -d opennova -f 99_sample_data.sql
```

### Tables already exist error?

Drop and recreate the database:
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS opennova;"
psql -U postgres -c "CREATE DATABASE opennova;"
# Then run all migrations again
```

### Permission denied errors?

Make sure PostgreSQL is running and you have the correct credentials:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -U postgres -h localhost -p 5432 -l
```

## Verifying Setup

After running all migrations and sample data, verify:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user count
SELECT COUNT(*) as total_users FROM users;

-- Check establishment count
SELECT COUNT(*) as total_establishments FROM establishments;

-- Check sample users
SELECT id, email, full_name, role, is_active FROM users;

-- Check sample establishments
SELECT id, name, type, status, owner_id FROM establishments;
```

You should see:
- At least 8 users (including admin and test users)
- At least 6 establishments
- All tables created successfully

## Notes

- Always run migrations in order (01, 03, 04, 05, 06, 07, 08, 10, 11, 12, 14, 15)
- Run `99_sample_data.sql` last to populate test data
- The sample data is safe to run multiple times (uses `ON CONFLICT DO NOTHING`)
- For production, skip the sample data file
