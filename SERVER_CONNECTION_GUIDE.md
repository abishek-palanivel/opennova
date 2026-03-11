# 🌐 Server Connection Guide

## Overview

This guide explains how to connect your OpenNova application to a server for production deployment.

## 🎯 Deployment Options

### Option 1: Free Cloud Hosting (Recommended)
- **Frontend**: Vercel (Free)
- **Backend**: Render.com or Fly.io (Free)
- **Database**: Neon.tech (Free PostgreSQL)

### Option 2: VPS/Dedicated Server
- **Server**: AWS EC2, DigitalOcean, Linode, etc.
- **Database**: Self-hosted PostgreSQL
- **Web Server**: Nginx + Java (Spring Boot)

---

## 🚀 Option 1: Free Cloud Hosting (Easiest)

### Step 1: Setup Database (Neon.tech)

1. **Create Account**: https://neon.tech
2. **Create Project**: `opennova-db`
3. **Copy Connection String**:
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy Backend (Render.com)

1. **Create Account**: https://render.com
2. **New Web Service** → Connect GitHub repository
3. **Configuration**:
   - Name: `opennova-backend`
   - Environment: `Java`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/opennova-0.0.1-SNAPSHOT.jar`
   - Instance Type: Free

4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb
   DATABASE_HOST=ep-xxx.neon.tech
   DATABASE_PORT=5432
   DATABASE_NAME=neondb
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   EMAIL_USERNAME=abishekopennova@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   FRONTEND_URL=https://your-app.vercel.app
   GOOGLE_MAPS_API_KEY=AIzaSyAB0k05dH8yvtYU3LsjQdOAeDdgiXBku88
   ```

5. **Deploy** → Wait for build to complete
6. **Your Backend URL**: `https://opennova-backend.onrender.com`

### Step 3: Deploy Frontend (Vercel)

1. **Create Account**: https://vercel.com
2. **Import Project** → Select GitHub repository
3. **Configuration**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://opennova-backend.onrender.com
   GENERATE_SOURCEMAP=false
   SKIP_PREFLIGHT_CHECK=true
   ```

5. **Deploy** → Wait for deployment
6. **Your Frontend URL**: `https://opennova.vercel.app`

### Step 4: Initialize Database

Connect to Neon database and run SQL scripts:

```bash
# Using psql
psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Run each SQL file
\i database/01_schema.sql
\i database/02_column_fixes.sql
\i database/03_constraints.sql
# ... continue with all files
```

Or use Neon SQL Editor in dashboard.

---

## 🖥️ Option 2: VPS/Dedicated Server

### Prerequisites

- Ubuntu 20.04+ or similar Linux server
- Root or sudo access
- Domain name (optional but recommended)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install openjdk-21-jdk -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE opennova;
CREATE USER opennova_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE opennova TO opennova_user;
\q

# Import database schema
psql -U opennova_user -d opennova -f /path/to/database/01_schema.sql
# Continue with other SQL files...
```

### Step 3: Deploy Backend

```bash
# Create application directory
sudo mkdir -p /opt/opennova/backend
cd /opt/opennova/backend

# Upload your backend JAR file
# (Use SCP, SFTP, or Git clone + build)

# Create application.properties
sudo nano application.properties
```

Add configuration:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/opennova
spring.datasource.username=opennova_user
spring.datasource.password=your_secure_password
server.port=9000
jwt.secret=your-super-secret-jwt-key
spring.mail.username=your-email@gmail.com
spring.mail.password=your-gmail-app-password
```

Create systemd service:
```bash
sudo nano /etc/systemd/system/opennova-backend.service
```

```ini
[Unit]
Description=OpenNova Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/opennova/backend
ExecStart=/usr/bin/java -jar opennova-0.0.1-SNAPSHOT.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable opennova-backend
sudo systemctl start opennova-backend
sudo systemctl status opennova-backend
```

### Step 4: Deploy Frontend

```bash
# Create frontend directory
sudo mkdir -p /var/www/opennova
cd /var/www/opennova

# Upload built frontend files
# Or build on server:
git clone https://github.com/abishek-palanivel/opennova.git
cd opennova/frontend
npm install
npm run build
sudo cp -r build/* /var/www/opennova/
```

### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/opennova
```

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/opennova;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend (optional separate subdomain)
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/opennova /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is configured automatically
```

---

## 🔧 Configuration Files

### Backend: application.properties

Update for production:
```properties
# Database
spring.datasource.url=jdbc:postgresql://your-db-host:5432/opennova
spring.datasource.username=your_username
spring.datasource.password=your_password

# Server
server.port=9000

# JWT
jwt.secret=your-production-jwt-secret-minimum-32-characters
jwt.expiration=86400000

# Email
spring.mail.username=your-email@gmail.com
spring.mail.password=your-gmail-app-password

# CORS - Update with your domain
cors.allowed-origins=https://your-domain.com,https://www.your-domain.com

# Google Maps
google.maps.api.key=your-google-maps-api-key
```

### Frontend: .env

```env
REACT_APP_API_URL=https://your-domain.com/api
# OR if using separate subdomain:
REACT_APP_API_URL=https://api.your-domain.com

GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
```

---

## 🔍 Testing Connection

### Test Backend

```bash
# Health check
curl https://your-backend-url/api/public/health

# Test login
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abishekopennova@gmail.com","password":"abi@1234"}'
```

### Test Frontend

1. Open browser: `https://your-domain.com`
2. Try logging in
3. Check browser console for errors
4. Verify API calls are working

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u opennova-backend -f

# Check if port is in use
sudo netstat -tulpn | grep 9000

# Check Java version
java -version
```

### Database connection fails
```bash
# Test PostgreSQL connection
psql -h localhost -U opennova_user -d opennova

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Frontend can't connect to backend
- Check CORS configuration in backend
- Verify REACT_APP_API_URL is correct
- Check Nginx proxy configuration
- Check browser console for errors

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📊 Monitoring

### Check Backend Status
```bash
sudo systemctl status opennova-backend
```

### View Logs
```bash
# Backend logs
sudo journalctl -u opennova-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Monitoring
```bash
# Connect to database
sudo -u postgres psql opennova

# Check connections
SELECT * FROM pg_stat_activity;
```

---

## 🔄 Updates and Maintenance

### Update Backend
```bash
# Stop service
sudo systemctl stop opennova-backend

# Replace JAR file
sudo cp new-version.jar /opt/opennova/backend/opennova-0.0.1-SNAPSHOT.jar

# Start service
sudo systemctl start opennova-backend
```

### Update Frontend
```bash
# Build new version
cd /path/to/frontend
npm run build

# Copy to web directory
sudo cp -r build/* /var/www/opennova/
```

### Database Backup
```bash
# Backup
pg_dump -U opennova_user opennova > backup_$(date +%Y%m%d).sql

# Restore
psql -U opennova_user opennova < backup_20240311.sql
```

---

## 💡 Quick Commands Reference

```bash
# Start backend
sudo systemctl start opennova-backend

# Stop backend
sudo systemctl stop opennova-backend

# Restart backend
sudo systemctl restart opennova-backend

# View backend logs
sudo journalctl -u opennova-backend -f

# Restart Nginx
sudo systemctl restart nginx

# Test Nginx config
sudo nginx -t

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify all configuration files
4. Ensure all services are running
5. Check firewall settings

Your application should now be accessible at your domain!
