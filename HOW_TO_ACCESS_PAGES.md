# How to Access Pages in Ramiscope PMT

## 🚀 Quick Start

### **1. Start the Application**

**Backend:**
```bash
cd ramiscope-pmt-system-backend
npm start
```
Server runs on: `http://localhost:3000`

**Frontend:**
```bash
cd ramiscope-project-management-system
npm start
```
Application runs on: `http://localhost:58046` (or port shown in terminal)

---

## 🔐 Login

1. Open browser: `http://localhost:58046`
2. You'll be redirected to: `http://localhost:58046/auth/login`
3. Enter credentials:
   - **Email:** Your registered email
   - **Password:** Your password
4. Click "Sign In"
5. You'll be redirected to the Dashboard

---

## 🧭 Navigation System

### **Desktop (≥1024px):**
1. Click the **hamburger menu** (☰) in the top-left corner
2. Navigation drawer slides in from the left
3. Content shifts to the right
4. Click menu items to navigate
5. Click hamburger again to close drawer

### **Mobile/Tablet (<1024px):**
1. **Option 1:** Click the hamburger menu (☰)
2. **Option 2:** Swipe right from the left edge of the screen
3. Navigation drawer overlays the content
4. Dark backdrop appears behind drawer
5. Click menu item to navigate (drawer auto-closes)
6. **To close:** Swipe left OR click the backdrop OR click the X button

---

## 📱 Swipe Gestures (Mobile)

### **Open Drawer:**
- Place finger on the **left edge** of the screen (within 50px)
- Swipe **right** at least 50px
- Drawer slides in

### **Close Drawer:**
- Place finger anywhere on the drawer
- Swipe **left** at least 50px
- Drawer slides out

---

## 📋 Available Pages

### **1. Dashboard** 📊
- **Route:** `/dashboard`
- **Access:** All authenticated users
- **How to Access:**
  1. Open navigation drawer
  2. Click "Dashboard" (first item)
- **Features:**
  - Welcome message
  - Statistics cards
  - Active projects
  - Recent activity
  - Quick actions

---

### **2. Team Management** 👥

#### **Team Member List Page**
- **Route:** `/users`
- **Access:** Admin, Manager, Superadmin
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Administration" section (click to expand)
  3. Click "Team Management"
- **Features:**
  - List of all users
  - Search users (real-time)
  - Filter by role and status
  - Sort by columns
  - Pagination
  - Add new user (admin only)
  - Edit user
  - View user details
  - Deactivate/Activate user

#### **User Detail Page**
- **Route:** `/users/:id`
- **Access:** Admin, Manager, Superadmin
- **How to Access:**
  1. Go to User List page
  2. Click on any user row
- **Features:**
  - User profile header
  - Contact information
  - Account information
  - Activity information
  - Project memberships
  - Edit button
  - Deactivate/Activate button

---

### **3. Projects** 📁
- **Routes:** `/projects`, `/projects/my`, `/projects/archived`
- **Access:** All authenticated users
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Projects" section
  3. Click:
     - "All Projects" - View all projects
     - "My Projects" - View your projects
     - "Archived" - View archived projects
- **Status:** 🚧 Coming soon

---

### **4. Tasks** ✓
- **Routes:** `/tasks`, `/tasks/my`, `/tasks/assigned`
- **Access:** All authenticated users
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Tasks" section
  3. Click:
     - "All Tasks" - View all tasks
     - "My Tasks" - View tasks you created
     - "Assigned to Me" - View tasks assigned to you
- **Status:** 🚧 Coming soon

---

### **5. Team** 👥
- **Routes:** `/team`, `/team/departments`
- **Access:** All authenticated users
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Team" section
  3. Click:
     - "Team Members" - View all team members
     - "Departments" - View departments
- **Status:** 🚧 Coming soon

---

### **6. Reports** 📈
- **Route:** `/reports`
- **Access:** All authenticated users
- **How to Access:**
  1. Open navigation drawer
  2. Click "Reports"
- **Status:** 🚧 Coming soon

---

### **7. Administration** 🛡️

#### **System Settings**
- **Route:** `/settings`
- **Access:** Superadmin, Admin only
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Administration" section
  3. Click "System Settings"
- **Status:** 🚧 Coming soon

#### **Audit Logs**
- **Route:** `/audit`
- **Access:** Superadmin, Admin only
- **How to Access:**
  1. Open navigation drawer
  2. Expand "Administration" section
  3. Click "Audit Logs"
- **Status:** 🚧 Coming soon

---

## 🎨 Visual Guide

### **Navigation Drawer Structure:**

```
┌─────────────────────────────────┐
│ 🎨 Ramiscope                [X] │ ← Header (gradient)
│    Project Management           │
├─────────────────────────────────┤
│ 👤 John Doe                     │ ← User Profile
│    Admin                        │
├─────────────────────────────────┤
│ 📊 Dashboard                    │ ← Menu Items
│ 📁 Projects              ▼      │
│    ├─ All Projects              │
│    ├─ My Projects               │
│    └─ Archived                  │
│ ✓ Tasks                  ▼      │
│    ├─ All Tasks                 │
│    ├─ My Tasks                  │
│    └─ Assigned to Me            │
│ 👥 Team                  ▼      │
│    ├─ Team Members              │
│    └─ Departments               │
│ 📈 Reports                      │
│ 🛡️ Administration       ▼      │
│    ├─ Team Management           │ ← YOU ARE HERE
│    ├─ System Settings           │
│    └─ Audit Logs                │
├─────────────────────────────────┤
│ [🚪 Logout]                     │ ← Footer
└─────────────────────────────────┘
```

---

## 🔐 Role-Based Access

### **Viewer:**
- ✅ Dashboard
- ✅ Projects (view only)
- ✅ Tasks (view only)
- ✅ Team (view only)
- ✅ Reports (view only)
- ❌ Team Management
- ❌ System Settings
- ❌ Audit Logs

### **Developer:**
- ✅ Dashboard
- ✅ Projects (create, edit)
- ✅ Tasks (create, edit)
- ✅ Team (view only)
- ✅ Reports (view only)
- ❌ Team Management
- ❌ System Settings
- ❌ Audit Logs

### **Manager:**
- ✅ Dashboard
- ✅ Projects (full access)
- ✅ Tasks (full access)
- ✅ Team (full access)
- ✅ Reports (full access)
- ✅ Team Management (view, edit)
- ❌ System Settings
- ❌ Audit Logs

### **Admin:**
- ✅ Dashboard
- ✅ Projects (full access)
- ✅ Tasks (full access)
- ✅ Team (full access)
- ✅ Reports (full access)
- ✅ Team Management (full access)
- ✅ System Settings (full access)
- ✅ Audit Logs (full access)

### **Superadmin:**
- ✅ Everything (full access)

---

## 🎯 Quick Actions

### **To Access Team Management:**
1. Login to the application
2. Click hamburger menu (☰) or swipe right
3. Scroll down to "Administration"
4. Click to expand
5. Click "Team Management"
6. You're now on the Team Member List page!

### **To Create a New Team Member:**
1. Go to Team Management page
2. Click "Add User" button (top-right)
3. Fill in the form:
   - Email
   - Username
   - Password (watch strength indicator)
   - First Name
   - Last Name
   - Role
4. Click "Create User"
5. User is created and list refreshes

### **To Edit a Team Member:**
1. Go to Team Management page
2. Click "Edit" button on user row
3. Update fields (first name, last name, role)
4. Click "Update User"
5. User is updated and list refreshes

### **To View Team Member Details:**
1. Go to Team Management page
2. Click on any user row
3. View complete profile
4. See project memberships
5. Perform actions (edit, deactivate, activate)

---

## 🐛 Troubleshooting

### **Can't see Team Management in menu:**
- Check your role (must be Admin, Manager, or Superadmin)
- Logout and login again
- Check browser console for errors

### **Drawer won't open:**
- Try clicking the hamburger menu
- Try refreshing the page
- Check browser console for errors

### **Swipe gestures not working:**
- Make sure you're on a touch device
- Start swipe from the left edge (within 50px)
- Swipe at least 50px distance
- Try using the hamburger menu instead

### **Page not found:**
- Check the URL
- Make sure you're logged in
- Check your role permissions
- Try navigating from the menu

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs
3. Verify database connection
4. Restart both frontend and backend
5. Clear browser cache and cookies

---

**Last Updated:** 2026-05-20  
**Version:** 1.0

