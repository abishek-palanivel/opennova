# OpenNova Database Migration Files

This directory contains all the database migration files for the OpenNova system. Run them in the following order:

## Migration Order

1. **01_schema.sql** - Main database schema with all tables and relationships
2. **02_column_fixes.sql** - Additional columns and fixes for existing tables
3. **03_constraints.sql** - Database constraints and validation rules
4. **04_user_columns.sql** - User table enhancements and triggers
5. **05_menu_columns.sql** - Menu table enhancements and triggers
6. **06_weekly_schedule.sql** - Weekly schedule system for establishments
7. **07_file_uploads.sql** - File upload and storage columns
8. **08_review_approval_system.sql** - Review approval workflow system
9. **09_fix_establishment_requests.sql** - Fix establishment request data (optional - only if needed)
10. **10_fix_user_roles.sql** - Update user roles to include new owner types
11. **11_seed_users_and_establishments.sql** - Seed initial users and establishments
12. **12_fix_establishment_schema.sql** - Critical establishment schema fixes
13. **13_add_password_to_establishment_requests.sql** - Add password field to establishment requests
14. **14_add_is_active_column.sql** - Add isActive column for suspend/activate functionality
15. **15_fix_phone_number_constraint.sql** - Remove NOT NULL constraint from phone_number columns

## How to Run

Execute each file in order using psql:

```bash
psql -h localhost -U postgres -d opennova -f database/01_schema.sql
psql -h localhost -U postgres -d opennova -f database/02_column_fixes.sql
psql -h localhost -U postgres -d opennova -f database/03_constraints.sql
psql -h localhost -U postgres -d opennova -f database/04_user_columns.sql
psql -h localhost -U postgres -d opennova -f database/05_menu_columns.sql
psql -h localhost -U postgres -d opennova -f database/06_weekly_schedule.sql
psql -h localhost -U postgres -d opennova -f database/07_file_uploads.sql
psql -h localhost -U postgres -d opennova -f database/08_review_approval_system.sql
psql -h localhost -U postgres -d opennova -f database/09_fix_establishment_requests.sql
psql -h localhost -U postgres -d opennova -f database/10_fix_user_roles.sql
psql -h localhost -U postgres -d opennova -f database/11_seed_users_and_establishments.sql
psql -h localhost -U postgres -d opennova -f database/12_fix_establishment_schema.sql
psql -h localhost -U postgres -d opennova -f database/13_add_password_to_establishment_requests.sql
psql -h localhost -U postgres -d opennova -f database/14_add_is_active_column.sql
psql -h localhost -U postgres -d opennova -f database/15_fix_phone_number_constraint.sql
```

## User Accounts Created

After running the seed file, you'll have these accounts:

- **User**: abishekjothi26@gmail.com / abi@1234
- **Admin**: abishekopennova@gmail.com / abi@1234  
- **Hotel Owner**: abishekpalanivel212@gmail.com / abi@1234
- **Shop Owner**: mithunpopennova@gmail.com / abi@1234
- **Hospital Owner**: abishekpopennova@gmail.com / abi@1234

## Database Structure

The database includes:
- Users with role-based access control
- Establishments (Hotels, Hospitals, Shops)
- Booking system with QR codes
- Review system with approval workflow
- File upload system
- Weekly scheduling system
- Payment and collection tracking

## Fresh Installation

For a fresh installation, run the seed file to get the correct user accounts:

```bash
psql -h localhost -U postgres -d opennova -f database/11_seed_users_and_establishments.sql
```

This will create all the user accounts with the correct passwords and establishments.