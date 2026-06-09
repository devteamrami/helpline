# 🔐 Super Admin Credentials

## Default Super Admin Account

After running the database initialization script (`node src/database/init.js`), a default super admin account is automatically created.

### Login Credentials

```
📧 Email:    superadmin@ramiscope.com
👤 Username: superadmin
🔑 Password: SuperAdmin@2024
```

## Role Hierarchy

The system has 5 roles ordered by authority level:

1. **Super Admin** 🔴
   - Complete system control
   - All privileges
   - Can manage all users and roles
   - Full access to all features

2. **Admin** 🟣
   - System administrator
   - Full access to manage users and projects
   - Cannot modify super admin accounts

3. **Manager** 🔵
   - Project manager
   - Team management capabilities
   - Project oversight

4. **Developer** 🟢
   - Developer access
   - Project access
   - Task management

5. **Viewer** ⚪
   - Read-only access
   - Can view assigned projects
   - No modification rights

## Security Recommendations

### ⚠️ IMPORTANT: Change Default Password

**After first login, immediately change the super admin password!**

Steps to change password:
1. Login with the default credentials
2. Go to Profile Settings
3. Change Password
4. Use a strong password with:
   - At least 12 characters
   - Uppercase and lowercase letters
   - Numbers
   - Special characters

### Password Requirements

All passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Best Practices

1. **Never share super admin credentials**
2. **Use unique passwords** for each account
3. **Enable two-factor authentication** (when implemented)
4. **Regularly review user access** and permissions
5. **Monitor audit logs** for suspicious activity
6. **Create separate admin accounts** for team members
7. **Disable or delete unused accounts**

## Testing the System

### Quick Test Steps

1. **Start Backend:**
   ```bash
   cd ramiscope-pmt-system-backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd ramiscope-project-management-system
   npm start
   ```

3. **Login:**
   - Open `http://localhost:4200`
   - Enter super admin credentials
   - You should see the dashboard

### What to Test

✅ **Authentication:**
- Login with super admin credentials
- Check if role badge shows "superadmin"
- Verify token is stored in localStorage

✅ **Dashboard:**
- All statistics cards display
- Projects section shows sample data
- Activity feed displays recent activities
- Quick actions buttons are visible
- Responsive design works on mobile

✅ **Navigation:**
- Header shows user information
- Logout button works
- Redirects to login after logout

✅ **Security:**
- Cannot access dashboard without login
- Token refresh works automatically
- Protected routes are secured

## Creating Additional Users

### Via API (Recommended for Testing)

```bash
# Create Admin User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ramiscope.com",
    "username": "admin",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Create Manager User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@ramiscope.com",
    "username": "manager",
    "password": "Manager@123",
    "firstName": "Project",
    "lastName": "Manager"
  }'

# Create Developer User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@ramiscope.com",
    "username": "developer",
    "password": "Developer@123",
    "firstName": "John",
    "lastName": "Developer"
  }'
```

**Note:** New users are assigned the "developer" role by default. Super admin can change roles later.

## Database Direct Access

If you need to access the database directly:

```bash
# Connect to database
psql -h fer-db-postgresql-nyc1-09987-do-user-14363842-0.b.db.ondigitalocean.com \
     -p 25060 \
     -U doadmin \
     -d ramiscope_pms

# View all users
SELECT id, email, username, first_name, last_name, r.name as role, is_active 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id;

# View all roles
SELECT * FROM roles ORDER BY created_at;

# Check super admin
SELECT u.*, r.name as role 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'superadmin@ramiscope.com';
```

## Troubleshooting

### Cannot Login

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5000/api/v1/health
   ```

2. **Verify database connection:**
   ```bash
   cd ramiscope-pmt-system-backend
   node src/database/init.js
   ```

3. **Check browser console** for errors

4. **Verify credentials** are correct (case-sensitive)

### Role Not Showing

1. Check if user has a role assigned in database
2. Verify role data is returned in login response
3. Check browser localStorage for user data

### Dashboard Not Loading

1. Verify you're logged in (check localStorage for tokens)
2. Check browser console for errors
3. Verify backend API is accessible
4. Check network tab for failed requests

## Support

For issues or questions:
1. Check the [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review [TROUBLESHOOTING](SETUP_GUIDE.md#troubleshooting) section
3. Check backend logs
4. Check browser console

---

**Remember:** Always change the default super admin password in production! 🔒
