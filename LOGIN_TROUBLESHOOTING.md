# 🔧 Login Troubleshooting Guide

## Issue: Cannot Login with Super Admin

### Quick Fix Steps

#### Step 1: Recreate Super Admin User

Run this command to create/update the super admin user with the correct password hash:

```bash
cd ramiscope-pmt-system-backend
node src/database/createSuperAdmin.js
```

You should see:
```
🔄 Creating/Updating Super Admin user...
✅ Password hashed successfully
✅ Super admin user updated successfully

👤 Super Admin Credentials:
   📧 Email: superadmin@ramiscope.com
   👤 Username: superadmin
   🔑 Password: SuperAdmin@2024

⚠️  IMPORTANT: Change the password after first login!
```

#### Step 2: Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Ramiscope PMS API is running",
  "timestamp": "...",
  "version": "v1"
}
```

#### Step 3: Test Login via API

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@ramiscope.com",
    "password": "SuperAdmin@2024"
  }'
```

If successful, you should get:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Step 4: Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear all localStorage
4. Refresh the page
5. Try logging in again

---

## Issue: Button Stuck on "Signing in..."

This happens when the login request fails but the loading state isn't reset.

### Fixes Applied

1. **Updated login component** to properly reset loading state
2. **Added better error handling** in auth service
3. **Added console logging** for debugging

### How to Debug

1. **Open Browser Console** (F12 → Console tab)
2. **Try to login**
3. **Check for errors** in the console
4. **Check Network tab** for the API request

Common errors and solutions:

#### Error: "Cannot connect to server"
**Solution:** Backend is not running
```bash
cd ramiscope-pmt-system-backend
npm run dev
```

#### Error: "Invalid credentials"
**Solution:** Password hash doesn't match
```bash
node src/database/createSuperAdmin.js
```

#### Error: "CORS error"
**Solution:** Check CORS configuration in backend `.env`
```env
CORS_ORIGIN=http://localhost:4200
```

#### Error: Network request failed
**Solution:** Check if backend URL is correct in `environment.ts`
```typescript
apiUrl: 'http://localhost:5000/api/v1'
```

---

## Complete Reset Procedure

If nothing works, follow these steps:

### 1. Stop All Servers

```bash
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)
```

### 2. Reset Database

```bash
cd ramiscope-pmt-system-backend

# Re-initialize database
node src/database/init.js

# Create super admin
node src/database/createSuperAdmin.js
```

### 3. Verify Database

```bash
# Connect to database
psql -h fer-db-postgresql-nyc1-09987-do-user-14363842-0.b.db.ondigitalocean.com \
     -p 25060 \
     -U doadmin \
     -d ramiscope_pms

# Check super admin user
SELECT u.email, u.username, u.is_active, r.name as role 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'superadmin@ramiscope.com';

# Exit
\q
```

### 4. Clear Frontend Cache

```bash
cd ramiscope-project-management-system

# Clear Angular cache
rm -rf .angular/cache
rm -rf node_modules/.cache

# Reinstall if needed
npm install
```

### 5. Restart Everything

```bash
# Terminal 1: Backend
cd ramiscope-pmt-system-backend
npm run dev

# Terminal 2: Frontend
cd ramiscope-project-management-system
npm start
```

### 6. Test Login

1. Open `http://localhost:4200`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Open DevTools Console (F12)
4. Try logging in
5. Watch console for errors

---

## Debugging Checklist

### Backend Checks

- [ ] Backend server is running on port 5000
- [ ] Health endpoint responds: `http://localhost:5000/api/v1/health`
- [ ] Database connection is working
- [ ] Super admin user exists in database
- [ ] Password hash is correct
- [ ] CORS is configured correctly
- [ ] No errors in backend console

### Frontend Checks

- [ ] Frontend is running on port 4200
- [ ] No errors in browser console
- [ ] Network tab shows API request
- [ ] API URL is correct in environment.ts
- [ ] localStorage is cleared
- [ ] Browser cache is cleared

### Database Checks

- [ ] PostgreSQL is running
- [ ] Database `ramiscope_pms` exists
- [ ] Tables are created (users, roles, etc.)
- [ ] Super admin role exists
- [ ] Super admin user exists
- [ ] User is active and verified

---

## Manual Password Reset

If you need to manually reset the super admin password:

### Method 1: Using Script (Recommended)

```bash
cd ramiscope-pmt-system-backend
node src/database/createSuperAdmin.js
```

### Method 2: Direct Database Update

```bash
# Connect to database
psql -h fer-db-postgresql-nyc1-09987-do-user-14363842-0.b.db.ondigitalocean.com \
     -p 25060 \
     -U doadmin \
     -d ramiscope_pms

# Update password (hash for "SuperAdmin@2024")
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq8nBXQyG',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'superadmin@ramiscope.com';

# Verify
SELECT email, username, is_active FROM users WHERE email = 'superadmin@ramiscope.com';

# Exit
\q
```

---

## Common Issues and Solutions

### Issue: "User not found"
**Cause:** Super admin user doesn't exist in database
**Solution:** Run `node src/database/createSuperAdmin.js`

### Issue: "Invalid credentials"
**Cause:** Password hash doesn't match
**Solution:** Run `node src/database/createSuperAdmin.js`

### Issue: "Account is deactivated"
**Cause:** User's `is_active` is false
**Solution:** 
```sql
UPDATE users SET is_active = true WHERE email = 'superadmin@ramiscope.com';
```

### Issue: "Cannot connect to server"
**Cause:** Backend not running or wrong URL
**Solution:** 
1. Start backend: `npm run dev`
2. Check URL in `environment.ts`

### Issue: Button stuck loading
**Cause:** JavaScript error or API timeout
**Solution:**
1. Check browser console for errors
2. Check network tab for failed requests
3. Restart frontend

---

## Getting Help

If you're still having issues:

1. **Check backend logs** - Look for errors in the terminal running the backend
2. **Check browser console** - Look for JavaScript errors
3. **Check network tab** - Look for failed API requests
4. **Verify environment** - Make sure all environment variables are set correctly

### Collect Debug Information

```bash
# Backend version
cd ramiscope-pmt-system-backend
node --version
npm --version

# Frontend version
cd ramiscope-project-management-system
ng version

# Database connection
psql -h fer-db-postgresql-nyc1-09987-do-user-14363842-0.b.db.ondigitalocean.com \
     -p 25060 \
     -U doadmin \
     -d ramiscope_pms \
     -c "SELECT version();"
```

---

## Success Indicators

You'll know everything is working when:

✅ Backend health check responds
✅ Super admin user exists in database
✅ Login API returns success with tokens
✅ Browser console shows no errors
✅ You're redirected to dashboard after login
✅ Dashboard displays user information
✅ Logout works correctly

---

**Remember:** The most common issue is the password hash not matching. Always run `createSuperAdmin.js` if you're having login issues!
