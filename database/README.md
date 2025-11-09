# OpenNova Database Setup Guide

## 📋 Execution Order (CRITICAL)

**IMPORTANT**: Database files must be executed in the correct order. See `00_EXECUTION_ORDER.md` for detailed instructions.

### Correct Execution Sequence:
1. **01_schema.sql** - Core database schema *(Must run first)*
2. **02_column_fixes.sql** - Column naming fixes
3. **03_constraints.sql** - Database constraints
4. **04_user_columns.sql** - User table enhancements
5. **05_menu_columns.sql** - Menu table enhancements
6. **06_weekly_schedule.sql** - Weekly schedule support
7. **07_file_uploads.sql** - File upload support
8. **08_review_approval_system.sql** - Review approval workflow
9. **09_seed_data.sql** - Test data *(Optional, run last)*

## 🚀 Quick Setup (Recommended)

### Automated Setup Scripts:

#### Windows:
```cmd
cd database
setup_ordered.bat
```

#### Linux/Mac:
```bash
cd database
chmod +x setup_ordered.sh
./setup_ordered.sh
```

## 🔧 Manual Setup

If you need to run files individually:
```bash
# Create database first
psql -U postgres -c "CREATE DATABASE opennova;"

# Execute in exact order:
psql -U postgres -d opennova -f 01_schema.sql
psql -U postgres -d opennova -f 02_column_fixes.sql
psql -U postgres -d opennova -f 03_constraints.sql
psql -U postgres -d opennova -f 04_user_columns.sql
psql -U postgres -d opennova -f 05_menu_columns.sql
psql -U postgres -d opennova -f 06_weekly_schedule.sql
psql -U postgres -d opennova -f 07_file_uploads.sql
psql -U postgres -d opennova -f 08_review_approval_system.sql
psql -U postgres -d opennova -f 09_seed_data.sql  # Optional
```

## ⚙️ Database Configuration

- **Database Name**: opennova
- **Username**: postgres
- **Password**: abi@1234
- **Port**: 5432
- **Host**: localhost

## 👥 Default Users (from seed data)

- **Admin**: abishekopennova@gmail.com / abi@1234
- **User**: abishekjothi26@gmail.com / abi@1234
- **Hotel Owner**: abishekpalanivel212@gmail.com / abi@1234
- **Hospital Owner**: mithunpopennova@gmail.com / abi@1234
- **Shop Owner**: abishekpopennova@gmail.com / abi@1234

## ✨ Features Added by Each Script

### Core Infrastructure:
- **01_schema.sql**: All base tables (users, establishments, bookings, reviews, etc.)
- **02_column_fixes.sql**: Column naming corrections (payment_amount → paid_amount)
- **03_constraints.sql**: Foreign keys and data validation rules

### User & Authentication:
- **04_user_columns.sql**: Reset tokens, establishment type fields

### Menu & Content Management:
- **05_menu_columns.sql**: Categories, preparation time, vegetarian flags
- **07_file_uploads.sql**: Image upload support, profile images

### Advanced Features:
- **06_weekly_schedule.sql**: Per-day operating hours and status
- **08_review_approval_system.sql**: Review approval workflow with owner control

### Test Data:
- **09_seed_data.sql**: Sample users and establishments for development

## 🔍 Verification

After setup, verify with:
```sql
-- Check migration tracking
SELECT * FROM schema_migrations ORDER BY version;

-- Verify review approval system
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name IN ('status', 'approved_at', 'rejected_at');

-- Check file upload support
SELECT column_name FROM information_schema.columns 
WHERE table_name IN ('menus', 'establishments') AND column_name LIKE '%image%';
```

## ⚠️ Important Notes

- **Order Matters**: Wrong execution order will cause errors
- **Safe Scripts**: All use `IF NOT EXISTS` - safe to run multiple times
- **Production**: Skip `09_seed_data.sql` in production
- **Backup**: Always backup existing databases before migrations

## 📚 Documentation Files

- **00_EXECUTION_ORDER.md** - Detailed execution order and dependencies
- **README.md** - This overview file
- **setup_ordered.bat** - Windows automated setup
- **setup_ordered.sh** - Linux/Mac automated setup

## 🆘 Troubleshooting

### Common Issues:
1. **Wrong execution order**: Follow the numbered sequence exactly
2. **Permission errors**: Ensure PostgreSQL user has CREATE privileges
3. **Constraint violations**: Check for existing data conflicts
4. **Missing dependencies**: Verify PostgreSQL version compatibility

### Getting Help:
- Check execution order in `00_EXECUTION_ORDER.md`
- Review error messages in console output
- Verify database connection parameters
- Ensure all prerequisite files have been executed