# 🚀 Ramiscope Project Management System - Complete Setup Guide

This guide will walk you through setting up the complete authentication system from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Testing the System](#testing-the-system)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v12 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

4. **Git** (optional, for version control)
   - Download: https://git-scm.com/
   - Verify: `git --version`

---

## Database Setup

### Step 1: Install PostgreSQL

**Windows:**
1. Download PostgreSQL installer from official website
2. Run installer and follow the wizard
3. Remember the password you set for the `postgres` user
4. Default port is `5432`

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

Open PostgreSQL command line:

**Windows:**
```bash
# Open Command Prompt or PowerShell
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
```

Create the database:
```sql
CREATE DATABASE ramiscope_pms;
\q
```

### Step 3: Verify Database Connection

```bash
psql -U postgres -d ramiscope_pms
```

If successful, you'll see the PostgreSQL prompt. Type `\q` to exit.

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd ramiscope-pmt-system-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- express
- pg (PostgreSQL client)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- dotenv (environment variables)
- cors, helmet (security)
- express-rate-limit (rate limiting)
- express-validator (validation)
- morgan (logging)
- uuid (unique IDs)

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your settings:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   API_VERSION=v1

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ramiscope_pms
   DB_USER=postgres
   DB_PASSWORD=your_actual_password_here

   # JWT Configuration (IMPORTANT: Use strong random strings in production)
   JWT_ACCESS_SECRET=your_super_secret_access_token_key_min_32_chars_long
   JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_min_32_chars_long
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:4200

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info
   ```

**⚠️ IMPORTANT:** 
- Replace `your_actual_password_here` with your PostgreSQL password
- Generate strong random strings for JWT secrets (at least 32 characters)
- You can use this command to generate secrets:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Step 4: Initialize Database Schema

```bash
node src/database/init.js
```

You should see:
```
✅ Database connected successfully
✅ Database initialized successfully
📊 Tables created:
   - roles
   - users
   - refresh_tokens
   - audit_logs
```

### Step 5: Start Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🚀 ============================================
🚀  Ramiscope PMS Backend Server Started
🚀 ============================================
📍 Environment: development
📍 Port: 5000
📍 API Version: v1
📍 URL: http://localhost:5000
📍 Health Check: http://localhost:5000/api/v1/health
🚀 ============================================
```

### Step 6: Test Backend API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Ramiscope PMS API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "v1"
}
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

Open a new terminal:

```bash
cd ramiscope-project-management-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Angular 21
- Angular Material
- RxJS
- TypeScript
- And other Angular dependencies

### Step 3: Verify Environment Configuration

Check `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',  // Should match backend URL
  // ...
};
```

### Step 4: Start Frontend Development Server

```bash
npm start
```

The Angular development server will start on `http://localhost:4200`

You should see:
```
✔ Browser application bundle generation complete.
Initial Chunk Files | Names         |  Raw Size
main.js             | main          |   XXX kB
...
✔ Compiled successfully.
```

### Step 5: Open Application

Open your browser and navigate to:
```
http://localhost:4200
```

You should be automatically redirected to the login page.

---

## Testing the System

### Test 1: Register a New User

1. Since you're on the login page, click "Create one now" to go to registration
   - **Note:** We haven't created the registration page yet, so let's test via API

2. **Test Registration via API:**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ramiscope.com",
    "username": "admin",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@ramiscope.com",
      "username": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Test 2: Login via UI

1. Go to `http://localhost:4200/auth/login`
2. Enter credentials:
   - **Email/Username:** `admin@ramiscope.com` or `admin`
   - **Password:** `Admin@123`
3. Click "Sign In"
4. You should be redirected to the dashboard

### Test 3: Verify Protected Route

1. After logging in, you should see the dashboard
2. Open browser DevTools (F12)
3. Go to Application → Local Storage → `http://localhost:4200`
4. You should see:
   - `rpms_access_token`
   - `rpms_refresh_token`
   - `rpms_user`

### Test 4: Logout

1. Click the "Logout" button in the dashboard
2. You should be redirected to the login page
3. Local storage should be cleared

### Test 5: Protected Route Access

1. After logging out, try to access: `http://localhost:4200/dashboard`
2. You should be automatically redirected to login page

---

## Troubleshooting

### Backend Issues

#### Issue: "Database connection failed"

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   sc query postgresql-x64-14
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check database credentials in `.env`
3. Test connection manually:
   ```bash
   psql -U postgres -d ramiscope_pms
   ```

#### Issue: "Missing required environment variables"

**Solution:**
1. Ensure `.env` file exists in backend root
2. Check all required variables are set:
   - DB_PASSWORD
   - JWT_ACCESS_SECRET
   - JWT_REFRESH_SECRET

#### Issue: "Port 5000 already in use"

**Solution:**
1. Change PORT in `.env` to another port (e.g., 5001)
2. Update `apiUrl` in frontend `environment.ts`
3. Restart backend server

#### Issue: "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

#### Issue: "Cannot connect to backend"

**Solution:**
1. Verify backend is running on `http://localhost:5000`
2. Check CORS settings in backend `.env`:
   ```env
   CORS_ORIGIN=http://localhost:4200
   ```
3. Check browser console for CORS errors

#### Issue: "Port 4200 already in use"

**Solution:**
```bash
# Kill the process using port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4200 | xargs kill -9

# Or use a different port
ng serve --port 4201
```

#### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### Issue: "relation does not exist"

**Solution:**
Run the database initialization script again:
```bash
cd ramiscope-pmt-system-backend
node src/database/init.js
```

#### Issue: "password authentication failed"

**Solution:**
1. Reset PostgreSQL password:
   ```bash
   # Windows (as Administrator)
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';
   
   # macOS/Linux
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'new_password';
   ```
2. Update `.env` with new password

---

## Next Steps

Now that your authentication system is working, you can:

1. **Add Registration Page** - Create a registration component in Angular
2. **Add Forgot Password** - Implement password reset functionality
3. **Add Email Verification** - Verify user emails after registration
4. **Add User Profile** - Allow users to update their profile
5. **Add Role-Based Access** - Implement different permissions for roles
6. **Add Projects Module** - Start building the project management features
7. **Add Teams Module** - Implement team management
8. **Add Tasks Module** - Create task management functionality

---

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT secrets (64+ characters)
3. Set up HTTPS
4. Configure proper CORS origins
5. Set up process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name ramiscope-backend
   ```
6. Set up reverse proxy (Nginx)
7. Configure firewall rules
8. Set up database backups
9. Enable logging and monitoring

### Frontend Deployment

1. Build for production:
   ```bash
   npm run build
   ```
2. Deploy `dist/` folder to web server
3. Configure web server (Nginx/Apache)
4. Set up HTTPS
5. Configure CDN for static assets
6. Set up error tracking (Sentry)
7. Configure analytics

---

## Support

If you encounter any issues:

1. Check the logs:
   - Backend: Console output
   - Frontend: Browser DevTools Console
   - Database: PostgreSQL logs

2. Review the documentation:
   - Backend: `ramiscope-pmt-system-backend/README.md`
   - Frontend: `ramiscope-project-management-system/README.md`

3. Common issues are documented in this guide's Troubleshooting section

---

## Congratulations! 🎉

You now have a fully functional, enterprise-grade authentication system with:

✅ Secure backend API with PostgreSQL
✅ Modern Angular frontend with beautiful UI
✅ JWT authentication with refresh tokens
✅ Protected routes and guards
✅ HTTP interceptors for automatic token handling
✅ Comprehensive error handling
✅ Rate limiting and security features
✅ Audit logging
✅ Production-ready architecture

Happy coding! 🚀
