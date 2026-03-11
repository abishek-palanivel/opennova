# Database Setup

## Quick Setup for Neon.tech

### Option 1: Single File (Recommended for Neon)

Use the all-in-one file that's compatible with Neon SQL Editor:

1. Open Neon SQL Editor: https://console.neon.tech
2. Copy content from `neon-setup-all.sql`
3. Paste and click "Run"

### Option 2: Individual Files (For local PostgreSQL)

Run files in this order:

1. `01_schema.sql` - Creates all tables
2. `02_column_fixes.sql` - Fixes column types
3. `03_constraints.sql` - Adds constraints
4. `04_user_columns.sql` - Adds user columns
5. `05_menu_columns.sql` - Adds menu columns
6. `06_weekly_schedule.sql` - Adds weekly schedule
7. `07_file_uploads.sql` - Adds file upload support
8. `08_review_approval_system.sql` - Adds review system
9. `10_chat_system.sql` - Adds chat system
10. `11_add_collection_description.sql` - Adds collection description
11. `12_add_upi_qr_code.sql` - Adds UPI QR code
12. `13_add_upi_qr_code_path.sql` - Adds UPI QR code path
13. `14_fix_user_roles.sql` - Fixes user roles
14. `15_add_login_attempt_tracking.sql` - Adds login tracking

## For Local Development

```bash
# Connect to local PostgreSQL
psql -U postgres -d opennova

# Run schema
\i database/01_schema.sql

# Run other files...
```

## Tables Created

- `users` - User accounts (customers, owners, admins)
- `establishments` - Hotels, hospitals, shops
- `bookings` - Booking records
- `reviews` - Customer reviews
- `menus` - Menu items for establishments
- `doctors` - Doctor information for hospitals
- `collections` - Collection items for shops
- `chat_messages` - Chat system
- `saved_establishments` - User favorites
- `establishment_requests` - New establishment requests
