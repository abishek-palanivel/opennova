# Account Lockout System

## Overview
The system now implements a security feature that locks user accounts after 3 consecutive failed login attempts for 24 hours.

## How It Works

### Backend Implementation
1. **User Model Updates**: Added `failed_login_attempts` and `account_locked_until` fields
2. **Database Migration**: `database/15_add_login_attempt_tracking.sql` adds the required columns
3. **AuthService Methods**:
   - `handleFailedLogin()`: Increments failed attempts, locks account after 3 attempts
   - `handleSuccessfulLogin()`: Resets failed attempts on successful login
   - `isAccountLocked()`: Checks if account is currently locked
   - `getAccountLockExpiry()`: Returns when the lock expires

### Security Features
- **3 Strike Rule**: Account locks after 3 failed login attempts
- **24 Hour Lockout**: Locked accounts are automatically unlocked after 24 hours
- **Automatic Reset**: Successful login resets the failed attempt counter
- **Privacy Protection**: Failed attempts are tracked even for non-existent emails (prevents user enumeration)

### Frontend Integration
- **Enhanced Error Messages**: Clear indication when account is locked
- **Visual Feedback**: Orange warning styling for lockout messages
- **Security Notice**: Additional information about the lockout reason

### API Endpoints
- `POST /api/auth/login`: Enhanced with lockout checking
- `POST /api/auth/check-account-status`: Check if account is locked

### Database Schema
```sql
ALTER TABLE users 
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN account_locked_until TIMESTAMP;
```

## Usage
The system works automatically:
1. User enters wrong credentials
2. System increments `failed_login_attempts`
3. After 3 failed attempts, `account_locked_until` is set to 24 hours from now
4. Login attempts return HTTP 423 (Locked) status
5. After 24 hours, account automatically unlocks
6. Successful login resets the counter

## Security Benefits
- Prevents brute force attacks
- Protects user accounts from unauthorized access
- Automatic recovery without admin intervention
- Maintains user privacy (no user enumeration)