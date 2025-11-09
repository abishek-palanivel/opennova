# OpenNova Setup Guide - Updated Features

## 🚀 Quick Start

### 1. Database Setup
Run the new migration script to add review approval system and file upload support:

```sql
-- Connect to your PostgreSQL database and run:
\i database/09_review_approval_system.sql
```

Or manually execute the SQL commands from the file.

### 2. Backend Configuration
Ensure your `application.properties` has the file upload configuration:

```properties
# File Upload Configuration
app.upload.dir=uploads
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB

# Email Configuration (ensure these are set)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### 3. Create Upload Directories
Create the necessary directories for file uploads:

```bash
mkdir -p uploads/menu-images
mkdir -p uploads/profile-images
mkdir -p uploads/payment-screenshots
```

### 4. Start the Application

#### Backend:
```bash
cd backend
mvn spring-boot:run
```

#### Frontend:
```bash
cd frontend
npm install
npm start
```

## 🎯 New Features Available

### For Owners:

1. **Menu Management** (`/owner/menus`)
   - Add menu items with image upload
   - Edit existing items
   - Toggle availability
   - Category management

2. **Review Management** (`/owner/reviews`)
   - Approve/reject customer reviews
   - View pending reviews
   - Provide rejection reasons
   - Monitor all review history

3. **Enhanced Booking Management** (`/owner/bookings`)
   - Approve bookings with QR code generation
   - Reject bookings with detailed reasons
   - Export to Excel with status filtering
   - View detailed booking information

4. **Profile Management** (`/owner/settings`)
   - Upload establishment profile images
   - Update establishment details
   - Manage operating status

### For Users:

1. **Enhanced Browsing**
   - View establishment profile images
   - See menu items with uploaded photos
   - Read only approved reviews

2. **Improved Booking Experience**
   - Detailed confirmation emails
   - QR codes for approved bookings
   - Clear rejection notifications

## 📧 Email Templates

The system now sends detailed emails for:

- ✅ **Booking Approval**: Complete details + QR code
- ❌ **Booking Rejection**: Reason + refund information
- 📝 **Review Approval**: Notification to customer
- 🚫 **Review Rejection**: Reason provided to customer

## 🔧 Testing the Features

### Test Menu Management:
1. Login as owner
2. Navigate to "Menu" section
3. Add a new menu item with image
4. Verify image appears in user portal

### Test Review Approval:
1. Create a review as a user
2. Login as owner
3. Go to "Reviews" → "Pending" tab
4. Approve or reject the review
5. Verify status in user portal

### Test Booking Workflow:
1. Create a booking as user
2. Login as owner
3. Approve booking in "Bookings" section
4. Check email for QR code
5. Test Excel export functionality

### Test Profile Images:
1. Login as owner
2. Go to "Settings"
3. Upload profile image
4. Verify image appears in user portal

## 🐛 Troubleshooting

### File Upload Issues:
- Check upload directory permissions
- Verify file size limits in application.properties
- Ensure proper CORS configuration

### Email Issues:
- Verify SMTP configuration
- Check email credentials
- Test with a simple email first

### Database Issues:
- Ensure migration script ran successfully
- Check for any constraint violations
- Verify indexes were created

### Frontend Issues:
- Clear browser cache
- Check console for JavaScript errors
- Verify API endpoints are accessible

## 📊 Monitoring

### Key Metrics to Monitor:
- File upload success rate
- Email delivery success
- Review approval workflow
- Booking conversion rates

### Log Files to Check:
- Application logs for errors
- Email service logs
- File upload logs
- Database query performance

## 🔒 Security Notes

### File Upload Security:
- Only image files allowed for menu/profile uploads
- File size limited to 5MB
- Unique file names prevent conflicts
- Files stored outside web root

### Access Control:
- Owners can only manage their own content
- Review approval requires ownership verification
- Booking management restricted to establishment owners

## 🎉 Success Indicators

✅ **System is working correctly when:**
- Owners can upload menu images successfully
- Reviews require approval before showing to users
- Booking approvals generate and send QR codes
- Excel exports include all booking statuses
- Profile images display in user portal
- Email notifications are delivered promptly

## 🧹 Project Cleanup

### Files Removed:
- `CLEANUP_COMPLETED.md` - Outdated cleanup documentation
- `LOCATION_MANAGEMENT_GUIDE.md` - Superseded by new implementation
- `frontend/src/components/debug/` - Empty debug directory
- `backend/target/` - Build artifacts (can be regenerated)

### Files Added:
- `.gitignore` - Comprehensive ignore rules for build artifacts and temporary files
- `backend/uploads/.gitkeep` - Maintains upload directory structure

## 📞 Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify database migrations completed
3. Ensure all dependencies are installed
4. Check file permissions for upload directories
5. Verify email configuration is correct

## 🎉 Final Summary

The system is now ready with all requested features implemented, tested, and properly organized:

✅ **Core Features**: Review approval, file uploads, enhanced booking management
✅ **Email System**: Detailed notifications with QR codes
✅ **Excel Export**: Comprehensive booking reports
✅ **Clean Codebase**: Removed redundant files and added proper .gitignore
✅ **Production Ready**: All components tested and integrated

The OpenNova platform now provides a complete, professional booking and management system!