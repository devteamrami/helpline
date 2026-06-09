# 🚀 Production Deployment Checklist

Use this checklist to ensure your Ramiscope PMS is production-ready.

## 📋 Pre-Deployment Checklist

### Backend Security

- [ ] **Environment Variables**
  - [ ] Strong JWT secrets (64+ characters)
  - [ ] Secure database password
  - [ ] NODE_ENV set to 'production'
  - [ ] No sensitive data in code
  - [ ] .env file not committed to git

- [ ] **Database Security**
  - [ ] Database user has minimal required permissions
  - [ ] Database not accessible from public internet
  - [ ] SSL/TLS enabled for database connections
  - [ ] Regular backup schedule configured
  - [ ] Database password is strong

- [ ] **API Security**
  - [ ] HTTPS enabled (SSL certificate installed)
  - [ ] CORS configured for production domain only
  - [ ] Rate limiting enabled and tested
  - [ ] Helmet.js security headers configured
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention verified
  - [ ] XSS protection enabled

- [ ] **Authentication**
  - [ ] JWT secrets are production-grade
  - [ ] Token expiration times appropriate
  - [ ] Refresh token rotation implemented
  - [ ] Password requirements enforced
  - [ ] Failed login attempts logged
  - [ ] Account lockout after failed attempts (optional)

### Frontend Security

- [ ] **Build Configuration**
  - [ ] Production build created (`npm run build`)
  - [ ] Source maps disabled or secured
  - [ ] Environment variables set correctly
  - [ ] API URL points to production backend
  - [ ] Debug code removed

- [ ] **Security Headers**
  - [ ] Content Security Policy configured
  - [ ] X-Frame-Options set
  - [ ] X-Content-Type-Options set
  - [ ] Referrer-Policy configured

### Infrastructure

- [ ] **Server Setup**
  - [ ] Server OS updated and patched
  - [ ] Firewall configured (only necessary ports open)
  - [ ] SSH key-based authentication
  - [ ] Non-root user for application
  - [ ] Fail2ban or similar installed

- [ ] **Application Server**
  - [ ] Process manager installed (PM2, systemd)
  - [ ] Auto-restart on failure configured
  - [ ] Log rotation configured
  - [ ] Memory limits set
  - [ ] CPU limits set (if needed)

- [ ] **Web Server**
  - [ ] Nginx/Apache installed and configured
  - [ ] Reverse proxy configured
  - [ ] SSL certificate installed (Let's Encrypt)
  - [ ] HTTP to HTTPS redirect
  - [ ] Gzip/Brotli compression enabled
  - [ ] Static file caching configured

- [ ] **Database Server**
  - [ ] PostgreSQL installed and configured
  - [ ] Automated backups configured
  - [ ] Backup restoration tested
  - [ ] Connection pooling configured
  - [ ] Query performance optimized

### Monitoring & Logging

- [ ] **Application Monitoring**
  - [ ] Health check endpoint working
  - [ ] Uptime monitoring configured
  - [ ] Error tracking setup (Sentry, etc.)
  - [ ] Performance monitoring (New Relic, etc.)
  - [ ] Alerts configured for critical issues

- [ ] **Logging**
  - [ ] Application logs configured
  - [ ] Log rotation setup
  - [ ] Centralized logging (optional)
  - [ ] Audit logs enabled
  - [ ] Error logs monitored

### Performance

- [ ] **Backend Optimization**
  - [ ] Database queries optimized
  - [ ] Indexes created on frequently queried columns
  - [ ] Connection pooling configured
  - [ ] Response compression enabled
  - [ ] Caching strategy implemented (if needed)

- [ ] **Frontend Optimization**
  - [ ] Production build optimized
  - [ ] Lazy loading implemented
  - [ ] Images optimized
  - [ ] CDN configured for static assets
  - [ ] Browser caching configured

### Testing

- [ ] **Functional Testing**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Token refresh works
  - [ ] Protected routes work
  - [ ] Logout works
  - [ ] All API endpoints tested

- [ ] **Security Testing**
  - [ ] SQL injection tested
  - [ ] XSS attacks tested
  - [ ] CSRF protection tested
  - [ ] Rate limiting tested
  - [ ] Authentication bypass tested
  - [ ] Authorization tested

- [ ] **Performance Testing**
  - [ ] Load testing completed
  - [ ] Stress testing completed
  - [ ] Database performance tested
  - [ ] API response times acceptable
  - [ ] Frontend load time acceptable

### Documentation

- [ ] **Technical Documentation**
  - [ ] API documentation complete
  - [ ] Database schema documented
  - [ ] Deployment process documented
  - [ ] Backup/restore process documented
  - [ ] Troubleshooting guide created

- [ ] **User Documentation**
  - [ ] User guide created
  - [ ] Admin guide created
  - [ ] FAQ created
  - [ ] Support contact information provided

## 🔧 Deployment Steps

### 1. Backend Deployment

#### Option A: Traditional Server (VPS/Dedicated)

```bash
# 1. Connect to server
ssh user@your-server.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 4. Create application directory
sudo mkdir -p /var/www/ramiscope-backend
sudo chown $USER:$USER /var/www/ramiscope-backend

# 5. Clone or upload code
cd /var/www/ramiscope-backend
# Upload your code here

# 6. Install dependencies
npm install --production

# 7. Setup environment
cp .env.example .env
nano .env  # Edit with production values

# 8. Initialize database
node src/database/init.js

# 9. Install PM2
sudo npm install -g pm2

# 10. Start application
pm2 start src/server.js --name ramiscope-backend

# 11. Setup PM2 startup
pm2 startup
pm2 save

# 12. Configure Nginx
sudo nano /etc/nginx/sites-available/ramiscope
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ramiscope /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### Option B: Cloud Platform (Heroku, AWS, Azure, GCP)

**Heroku:**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create ramiscope-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set JWT_REFRESH_SECRET=your_secret

# Deploy
git push heroku main

# Initialize database
heroku run node src/database/init.js
```

**AWS Elastic Beanstalk:**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create ramiscope-backend-prod

# Deploy
eb deploy
```

### 2. Frontend Deployment

#### Option A: Static Hosting (Netlify, Vercel, AWS S3)

**Build:**
```bash
cd ramiscope-project-management-system

# Update environment
nano src/environments/environment.prod.ts
# Set production API URL

# Build
npm run build
```

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist/ramiscope-project-management-system/browser
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**AWS S3 + CloudFront:**
```bash
# Upload to S3
aws s3 sync dist/ramiscope-project-management-system/browser s3://your-bucket-name

# Configure CloudFront distribution
# Point to S3 bucket
# Enable HTTPS
# Configure custom domain
```

#### Option B: Traditional Server

```bash
# 1. Build application
npm run build

# 2. Upload dist folder to server
scp -r dist/ramiscope-project-management-system/browser user@server:/var/www/ramiscope-frontend

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/ramiscope-frontend
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/ramiscope-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ramiscope-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔍 Post-Deployment Verification

### Backend Verification

```bash
# 1. Health check
curl https://api.yourdomain.com/api/v1/health

# 2. Test registration
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"Test@123"}'

# 3. Test login
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# 4. Check logs
pm2 logs ramiscope-backend
```

### Frontend Verification

- [ ] Open https://yourdomain.com
- [ ] Check console for errors
- [ ] Test login functionality
- [ ] Verify protected routes work
- [ ] Test logout functionality
- [ ] Check responsive design
- [ ] Verify all assets load correctly

### Security Verification

```bash
# 1. SSL/TLS check
curl -I https://yourdomain.com

# 2. Security headers check
curl -I https://yourdomain.com | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"

# 3. CORS check
curl -H "Origin: https://malicious-site.com" https://api.yourdomain.com/api/v1/health

# 4. Rate limiting check
for i in {1..10}; do curl https://api.yourdomain.com/api/v1/auth/login; done
```

## 📊 Monitoring Setup

### Application Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Uptime Monitoring:**
- Sign up for UptimeRobot or Pingdom
- Add health check endpoint
- Configure alerts

**Error Tracking:**
```bash
# Install Sentry
npm install @sentry/node

# Configure in backend
# Add to app.js
```

### Database Monitoring

```bash
# Setup automated backups
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump ramiscope_pms > /backups/ramiscope_$(date +\%Y\%m\%d).sql
```

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Check disk space
- [ ] Verify backups completed

**Weekly:**
- [ ] Review security logs
- [ ] Check performance metrics
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration

**Monthly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database maintenance
- [ ] SSL certificate renewal check

### Update Process

```bash
# 1. Backup database
pg_dump ramiscope_pms > backup_$(date +%Y%m%d).sql

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Run migrations (if any)
# node migrations/run.js

# 5. Restart application
pm2 restart ramiscope-backend

# 6. Verify deployment
curl https://api.yourdomain.com/api/v1/health
```

## 🆘 Rollback Plan

```bash
# 1. Stop application
pm2 stop ramiscope-backend

# 2. Restore previous version
git checkout <previous-commit>
npm install

# 3. Restore database (if needed)
psql ramiscope_pms < backup_YYYYMMDD.sql

# 4. Restart application
pm2 start ramiscope-backend

# 5. Verify
curl https://api.yourdomain.com/api/v1/health
```

## ✅ Final Checklist

- [ ] All pre-deployment checks completed
- [ ] Backend deployed and verified
- [ ] Frontend deployed and verified
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backups configured and tested
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan tested
- [ ] Support team briefed

## 🎉 Congratulations!

Your Ramiscope PMS is now live in production!

### Next Steps:
1. Monitor application closely for first 24-48 hours
2. Gather user feedback
3. Plan next feature releases
4. Continue security updates
5. Optimize based on real usage patterns

---

**Remember:** Security and monitoring are ongoing processes, not one-time tasks!
