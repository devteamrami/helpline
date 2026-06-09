# Ramiscope PMT - Updated System Architecture

## 🏗️ System Overview

Based on clarifications, the system manages two distinct user types:

### **1. Internal Team (6 employees)**
- Your company's employees
- Full system access
- Managed through "Team Management"

### **2. Project Users (5K+ per project)**
- External users across 8+ projects
- Project-specific access
- Managed per project through "Project Members"

---

## 👥 User Types & Roles

### **Internal Team Roles** (System-wide)
```
Superadmin
├─ Full system access
├─ Manage all users and projects
├─ System configuration
└─ Audit logs

Admin
├─ Manage users and projects
├─ System settings
└─ Audit logs

Manager
├─ Manage projects and tasks
├─ View team members
└─ Reports

Developer
├─ Work on projects and tasks
└─ View team members

Viewer
└─ Read-only access
```

### **Project User Roles** (Per-project)
```
Project Admin
├─ Full project access
├─ Manage project members
├─ Project settings
└─ All project features

Project Manager
├─ Manage tasks and assignments
├─ View project members
└─ Project reports

Project Member
├─ Work on assigned tasks
├─ View project information
└─ Collaborate with team

Project Viewer
└─ Read-only project access
```

---

## 📊 Database Schema

### **Users Table** (Internal Team)
```sql
users
├─ id (UUID)
├─ email (unique)
├─ username (unique)
├─ password_hash
├─ first_name
├─ last_name
├─ role (Superadmin, Admin, Manager, Developer, Viewer)
├─ is_active
├─ is_verified
├─ last_login
├─ created_at
├─ updated_at
└─ created_by
```

### **Project Users Table** (External Users)
```sql
project_users (NEW TABLE - TO BE CREATED)
├─ id (UUID)
├─ email (unique per project)
├─ username
├─ password_hash
├─ first_name
├─ last_name
├─ emp_code (employee code - for future)
├─ signature (digital signature - for future)
├─ phone
├─ department
├─ is_active
├─ is_verified
├─ last_login
├─ created_at
├─ updated_at
└─ created_by
```

### **Project Members Table** (User-Project Association)
```sql
project_members
├─ id (UUID)
├─ project_id (FK → projects)
├─ user_id (FK → project_users)
├─ role (Project Admin, Project Manager, Project Member, Project Viewer)
├─ joined_at
├─ invited_by (FK → users)
├─ is_active
└─ permissions (JSON - custom permissions)
```

**Note:** Same user can be in multiple projects with different roles!

### **Projects Table**
```sql
projects
├─ id (UUID)
├─ name
├─ description
├─ code (unique project code)
├─ status (Active, Completed, On Hold, Archived)
├─ start_date
├─ end_date
├─ created_by (FK → users)
├─ created_at
├─ updated_at
└─ settings (JSON)
```

---

## 🗂️ Menu Structure (Updated)

### **Navigation Menu:**
```
📊 Dashboard
   └─ Overview, stats, recent activity

📁 Projects
   ├─ All Projects (8+ projects)
   ├─ My Projects (projects you manage)
   └─ Archived (old projects)

✓ Tasks
   ├─ All Tasks
   ├─ My Tasks
   └─ Assigned to Me

👥 Team (Internal - 6 employees)
   ├─ Team Members (your employees)
   └─ Departments (internal departments)

📈 Reports
   └─ Project reports, analytics

🛡️ Administration
   ├─ Team Management (renamed from "User Management")
   ├─ System Settings
   └─ Audit Logs
```

### **Project Detail Page:**
```
Project: "Mobile App Development"
├─ Overview
├─ Tasks
├─ Members (5K+ project users)
│  ├─ List members
│  ├─ Add member
│  ├─ Import members (CSV/Excel)
│  ├─ Export members
│  └─ Manage roles
├─ Settings
└─ Analytics
```

---

## 🚀 Implementation Phases

### **Phase 1: Team Management** ✅ (COMPLETE)
- ✅ Renamed "User Management" → "Team Management"
- ✅ CRUD operations for internal team (6 employees)
- ✅ Role-based access control
- ✅ User list, detail, create, edit, deactivate

### **Phase 2: Project Management** 🔄 (NEXT)
- Create projects module
- List all projects
- Project detail page
- Project CRUD operations
- Project status management

### **Phase 3: Project Members Management** ⏳
- Create project_users table
- Create project members management
- Add/Remove members per project
- Assign project roles
- Member list per project

### **Phase 4: Bulk User Import** ⏳
- CSV import for project users
- Excel (XLSX) import
- Column mapping
- Data validation
- Preview before import
- Send invitation emails
- Error handling and reporting

### **Phase 5: Tasks Management** ⏳
- Create tasks module
- Task assignment
- Task tracking
- Task comments and attachments

### **Phase 6: Reports & Analytics** ⏳
- Project reports
- User activity reports
- Task completion reports
- Custom reports

---

## 📋 Detailed Feature List

### **Team Management** (Internal - 6 employees)
```
✅ List team members
✅ Search team members
✅ Filter by role
✅ View member details
✅ Add new member
✅ Edit member (name, role)
✅ Deactivate member
✅ Activate member
⏳ Manage departments
⏳ Team hierarchy
```

### **Project Management** (8+ projects)
```
⏳ List all projects
⏳ Search projects
⏳ Filter by status
⏳ View project details
⏳ Create new project
⏳ Edit project
⏳ Archive project
⏳ Project settings
⏳ Project analytics
```

### **Project Members** (5K+ per project)
```
⏳ List project members
⏳ Search members
⏳ Filter by role
⏳ View member details
⏳ Add member to project
⏳ Remove member from project
⏳ Change member role
⏳ Import members (CSV)
⏳ Import members (Excel)
⏳ Export members
⏳ Send invitation emails
⏳ Bulk operations
```

### **Bulk User Import**
```
⏳ Upload CSV file
⏳ Upload Excel file
⏳ Map columns to fields
   - Email (required)
   - First Name (required)
   - Last Name (required)
   - Role (required)
   - Username (optional)
   - Phone (optional)
   - Department (optional)
   - Emp Code (optional - future)
   - Signature (optional - future)
⏳ Validate data
   - Check required fields
   - Validate email format
   - Check for duplicates
   - Validate role values
⏳ Preview import
   - Show valid records
   - Show errors
   - Allow corrections
⏳ Confirm and import
⏳ Send invitation emails
   - Email template
   - Set password link
   - Welcome message
⏳ Import report
   - Success count
   - Error count
   - Error details
```

---

## 🔐 Security & Permissions

### **Internal Team Permissions:**
```
Superadmin
├─ Manage all internal team members
├─ Manage all projects
├─ Manage all project members
├─ System settings
└─ Audit logs

Admin
├─ Manage internal team members
├─ Manage projects
├─ Manage project members
└─ Audit logs

Manager
├─ View internal team members
├─ Manage assigned projects
├─ Manage project members (assigned projects)
└─ View reports

Developer
├─ View internal team members
├─ View assigned projects
└─ Work on tasks

Viewer
└─ Read-only access
```

### **Project User Permissions:**
```
Project Admin
├─ Manage project members
├─ Manage tasks
├─ Project settings
└─ All project features

Project Manager
├─ View project members
├─ Manage tasks
└─ Assign tasks

Project Member
├─ View project members
├─ Work on assigned tasks
└─ Comment on tasks

Project Viewer
└─ Read-only project access
```

---

## 📧 Email Notifications

### **Invitation Email (Project Users):**
```
Subject: You've been invited to join [Project Name]

Hi [First Name],

You've been invited to join the project "[Project Name]" 
as a [Project Role].

Click the link below to set your password and get started:
[Set Password Link]

Project Details:
- Project: [Project Name]
- Role: [Project Role]
- Invited by: [Admin Name]

If you have any questions, please contact your project administrator.

Best regards,
Ramiscope Team
```

### **Bulk Import Completion Email (Admin):**
```
Subject: User Import Completed - [Project Name]

Hi [Admin Name],

Your bulk user import for project "[Project Name]" has been completed.

Import Summary:
- Total Records: 150
- Successfully Imported: 145
- Failed: 5

✅ 145 users have been added to the project
📧 145 invitation emails have been sent

❌ 5 records failed:
1. john@example.com - Duplicate email
2. jane@example.com - Invalid email format
3. ...

View detailed report: [Link]

Best regards,
Ramiscope System
```

---

## 🎯 Next Steps

### **Immediate (This Session):**
1. ✅ Fix arrow icons in sidebar
2. ✅ Rename "User Management" → "Team Management"
3. 🔄 Update documentation

### **Next Session:**
1. Create Project Management module
   - Backend: Projects CRUD API
   - Frontend: Projects list and detail pages
2. Create project_users table
3. Create Project Members management
   - Backend: Project members API
   - Frontend: Members list per project

### **Future Sessions:**
1. Build Bulk User Import feature
   - CSV parser
   - Excel parser
   - Data validation
   - Email service integration
2. Build Tasks Management module
3. Build Reports & Analytics

---

## 📝 Notes

### **Important Considerations:**

1. **User Uniqueness:**
   - Internal team: Email unique globally
   - Project users: Email unique per project (same user can be in multiple projects)

2. **Performance:**
   - Pagination for large user lists (5K+)
   - Lazy loading for project members
   - Caching for frequently accessed data

3. **Scalability:**
   - Database indexing on email, project_id, user_id
   - Bulk operations for large imports
   - Background jobs for email sending

4. **Future Fields:**
   - `emp_code` - Employee code (for HR integration)
   - `signature` - Digital signature (for document signing)
   - Additional custom fields as needed

5. **Email Service:**
   - Use existing email service or integrate new one
   - Queue emails for bulk operations
   - Track email delivery status

---

**Document Version:** 2.0  
**Last Updated:** 2026-05-20  
**Status:** Architecture Finalized ✅

