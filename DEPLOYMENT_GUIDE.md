# 🚀 OpenNova Deployment Guide

Deploy your OpenNova project to the internet using free services:
- **Frontend**: Vercel (Free tier)
- **Backend**: Fly.io (Free tier)
- **Database**: Neon.tech (Free tier)

## 📋 Prerequisites

1. **Git repository** - Push your code to GitHub/GitLab
2. **Node.js** - For frontend deployment
3. **Accounts on**:
   - [Vercel](https://vercel.com) (Frontend hosting)
   - [Fly.io](https://fly.io) (Backend hosting)
   - [Neon.tech](https://neon.tech) (PostgreSQL database)

## 🗄️ Step 1: Setup Database (Neon.tech)

1. **Create Neon Account**:
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub/Google
   - Create a new project

2. **Get Database Credentials**:
   ```
   Database URL: postgresql://username:password@host/database
   Username: your_username
   Password: your_password
   Host: your_host.neon.tech
   Database: neondb
   ```

3. **Run Database Setup**:
   - Connect to your Neon database using pgAdmin or psql
   - Run all SQL files from the `database/` folder in order:
   ```sql
   \i database/01_schema.sql
   \i database/02_seed_data.sql
   -- Continue with all files...
   ```

## 🖥️ Step 2: Deploy Backend (Fly.io)

1. **Install Fly CLI**:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Create Fly App**:
   ```bash
   flyctl apps create opennova-backend
   ```

4. **Set Environment Variables**:
   ```bash
   flyctl secrets set DATABASE_URL="postgresql://username:password@host/database"
   flyctl secrets set DATABASE_USERNAME="your_username"
   flyctl secrets set DATABASE_PASSWORD="your_password"
   flyctl secrets set JWT_SECRET="your-super-secret-jwt-key-here"
   flyctl secrets set EMAIL_USERNAME="your-email@gmail.com"
   flyctl secrets set EMAIL_PASSWORD="your-gmail-app-password"
   flyctl secrets set FRONTEND_URL="https://your-app.vercel.app"
   flyctl secrets set GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
   ```

5. **Deploy Backend**:
   ```bash
   flyctl deploy
   ```

6. **Your backend will be available at**: `https://opennova-backend.fly.dev`

## 🌐 Step 3: Deploy Frontend (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to Frontend**:
   ```bash
   cd frontend
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

5. **Set Environment Variable**:
   - In Vercel dashboard, go to your project settings
   - Add environment variable:
     - Name: `REACT_APP_API_BASE_URL`
     - Value: `https://opennova-backend.fly.dev`

6. **Redeploy** after setting the environment variable

## 🔧 Step 4: Configure CORS

Update your backend's CORS configuration to allow your Vercel domain:

1. In Fly.io, set the FRONTEND_URL:
   ```bash
   flyctl secrets set FRONTEND_URL="https://your-vercel-app.vercel.app"
   ```

2. Redeploy backend:
   ```bash
   flyctl deploy
   ```

## 📧 Step 5: Setup Email Service

1. **Enable 2FA on Gmail**
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. **Use App Password** in EMAIL_PASSWORD environment variable

## 🗝️ Step 6: Get API Keys

1. **Google Maps API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Maps JavaScript API
   - Create API key
   - Restrict to your domains

## 🚀 Quick Deploy Scripts

Use the provided scripts for easy deployment:

```bash
# Make scripts executable
chmod +x deploy-backend.sh deploy-frontend.sh

# Deploy backend
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh
```

## 🔍 Verification Steps

1. **Backend Health Check**:
   ```
   GET https://your-backend.fly.dev/api/public/health
   ```

2. **Frontend Access**:
   - Visit your Vercel URL
   - Try logging in with test credentials
   - Check browser console for errors

3. **Database Connection**:
   - Check Fly.io logs: `flyctl logs`
   - Verify database tables exist in Neon dashboard

## 🐛 Troubleshooting

### Backend Issues:
- **Check logs**: `flyctl logs`
- **Database connection**: Verify Neon credentials
- **Memory issues**: Upgrade Fly.io plan if needed

### Frontend Issues:
- **API calls failing**: Check CORS configuration
- **Build errors**: Check Vercel build logs
- **Environment variables**: Verify in Vercel dashboard

### Database Issues:
- **Connection timeout**: Check Neon connection limits
- **Missing tables**: Run database setup scripts
- **Permission errors**: Verify database user permissions

## 💰 Cost Breakdown (All Free Tiers)

- **Neon.tech**: Free tier (512MB storage, 1 database)
- **Fly.io**: Free tier (3 shared-cpu-1x machines, 160GB/month)
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)

## 🔄 Continuous Deployment

### Auto-deploy from Git:

1. **Vercel**: Connect GitHub repository for auto-deployment
2. **Fly.io**: Use GitHub Actions for CI/CD

### GitHub Actions Example:
```yaml
name: Deploy to Fly.io
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## 🎉 Success!

Your OpenNova platform is now live on the internet! 

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.fly.dev
- **Database**: Hosted on Neon.tech

All services are on free tiers and will stay awake 24/7!

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service-specific documentation
3. Check logs for error messages
4. Verify all environment variables are set correctly