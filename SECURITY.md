# Security Guidelines

## Environment Variables

This project uses environment variables to store sensitive configuration. **Never commit actual credentials to version control.**

### Setup Instructions

1. **Backend Setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

### Required Credentials

#### Razorpay API Keys
- Get your API keys from [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Use **Test Mode** keys for development
- Use **Live Mode** keys only in production
- **NEVER** share your API Secret publicly

#### Database Credentials
- PostgreSQL connection details
- Use strong passwords
- Different credentials for dev/prod

#### Email Configuration
- Gmail App Password (not your regular password)
- Enable 2FA and generate app-specific password

#### JWT Secret
- Generate a strong random string
- Minimum 32 characters recommended
- Use different secrets for dev/prod

## Security Best Practices

1. ✅ Always use `.env` files for sensitive data
2. ✅ Keep `.env` in `.gitignore`
3. ✅ Use `.env.example` as a template (without real values)
4. ✅ Rotate credentials regularly
5. ✅ Use different credentials for dev/test/prod
6. ❌ Never commit API keys, passwords, or secrets
7. ❌ Never share credentials in chat or screenshots
8. ❌ Never hardcode credentials in source code

## If Credentials Are Exposed

If you accidentally expose credentials:

1. **Immediately revoke** the exposed credentials
2. **Generate new** credentials
3. **Update** your `.env` files
4. **Restart** your application
5. **Review** git history and remove exposed data if committed

## Reporting Security Issues

If you discover a security vulnerability, please email: abishekopennova@gmail.com

Do not create public GitHub issues for security vulnerabilities.
