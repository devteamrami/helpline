# User/Member Management Module Dependency

## Overview

The Project Configuration Management module has a **critical dependency** on a User/Member Management module that does not currently exist in the Ramiscope Project Management System. This document outlines the required functionality that must be implemented before the Project Member Management features can be completed.

## Why This Dependency Exists

The current system has:
- ✅ User authentication (login/register)
- ✅ User table in database
- ✅ Role-based access control
- ❌ **NO user listing/search functionality**
- ❌ **NO user management UI**
- ❌ **NO admin interface to view/manage users**

The Project Configuration module needs to:
- Add existing system users as project members
- Search for users to add to projects
- Display user information when managing project members

**Without the User Management module, project admins cannot add members to projects.**

## Required User Management Module Features

### Backend APIs Required

#### 1. List Users
```
GET /api/v1/users
```
**Purpose**: List all users in the system with pagination and filtering

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name, email, or username
- `role` (string): Filter by system role
- `isActive` (boolean): Filter by active status

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "john.doe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "developer",
        "isActive": true,
        "isVerified": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

**Authorization**: admin, superadmin (managers can view users for their projects only)

#### 2. Search Users
```
GET /api/v1/users/search?q={query}
```
**Purpose**: Quick search for users by name, email, or username

**Query Parameters**:
- `q` (string, required): Search query (minimum 2 characters)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "john.doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "developer",
      "isActive": true
    }
  ]
}
```

**Authorization**: Any authenticated user (for adding project members)

#### 3. Get User Details
```
GET /api/v1/users/:userId
```
**Purpose**: Get detailed information about a specific user

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer",
    "isActive": true,
    "isVerified": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "projects": [
      {
        "projectId": "uuid",
        "projectName": "Project A",
        "projectRole": "Lead Dev"
      }
    ]
  }
}
```

**Authorization**: admin, superadmin, or the user themselves

#### 4. Get Available Users for Project
```
GET /api/v1/users/available/:projectId
```
**Purpose**: Get users who are NOT already members of a specific project

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "jane.smith",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "developer",
      "isActive": true
    }
  ]
}
```

**Authorization**: manager, admin, superadmin (must be project member or superadmin)

#### 5. Create User (Admin Only)
```
POST /api/v1/users
```
**Purpose**: Create a new user account (admin function)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePassword123!",
  "firstName": "New",
  "lastName": "User",
  "role": "developer"
}
```

**Authorization**: admin, superadmin only

#### 6. Update User
```
PUT /api/v1/users/:userId
```
**Purpose**: Update user information

**Request Body**:
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "manager",
  "isActive": true
}
```

**Authorization**: admin, superadmin, or the user themselves (limited fields)

#### 7. Deactivate User
```
DELETE /api/v1/users/:userId
```
**Purpose**: Soft delete (deactivate) a user account

**Authorization**: superadmin only

### Frontend Components Required

#### 1. User List Component
**File**: `src/app/features/users/user-list/user-list.component.ts`

**Features**:
- Display users in a Material table
- Pagination controls
- Search bar
- Filter by role and active status
- Sort by name, email, role, created date
- Click user to view details
- Admin actions (edit, deactivate)

**UI Elements**:
- `<mat-table>` with columns: Name, Email, Role, Status, Actions
- `<mat-paginator>` for pagination
- `<mat-form-field>` for search input
- `<mat-select>` for role filter
- `<mat-slide-toggle>` for active/inactive filter

#### 2. User Detail Component
**File**: `src/app/features/users/user-detail/user-detail.component.ts`

**Features**:
- Display complete user profile
- Show user's project memberships
- Edit button (for admins)
- Activity history

#### 3. User Search Dialog Component
**File**: `src/app/features/users/user-search-dialog/user-search-dialog.component.ts`

**Features**:
- Autocomplete search input
- Real-time search results
- User selection
- Display user details on hover
- Used by Project Member Management to add members

**UI Elements**:
- `<mat-autocomplete>` for search
- `<mat-list>` for results
- `<mat-card>` for user preview

#### 4. Add/Edit User Dialog Component
**File**: `src/app/features/users/user-form-dialog/user-form-dialog.component.ts`

**Features**:
- Reactive form for user data
- Validation (email format, password strength, etc.)
- Role selector
- Active status toggle
- Create or update mode

#### 5. User Service
**File**: `src/app/core/services/user.service.ts`

**Methods**:
- `getUsers(params)` - List users with filters
- `searchUsers(query)` - Search users
- `getUserById(id)` - Get user details
- `getAvailableUsers(projectId)` - Get users not in project
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user
- `deactivateUser(id)` - Deactivate user

### Database Schema (Already Exists)

The `users` table already exists with the necessary structure:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**No database changes needed** - only API endpoints and UI components.

## Implementation Sequence

### Phase 1: User Management Module (MUST BE FIRST)
1. Create backend API endpoints for user management
2. Create user service in Angular
3. Create user list component
4. Create user search dialog component
5. Create user detail component
6. Create user form dialog component
7. Add routing for user management
8. Add navigation menu item for user management

### Phase 2: Project Configuration Module (AFTER PHASE 1)
1. Implement project member management using User Management APIs
2. Create member management component with user search integration
3. Create add member dialog using user search dialog
4. Implement member list with user details
5. Complete remaining project configuration features

## Integration Points

### How Project Member Management Uses User Management

1. **Adding Members**:
   ```typescript
   // User searches for a user
   this.userService.searchUsers('john').subscribe(users => {
     // Display users in autocomplete
   });
   
   // User selects a user and role
   this.memberService.addMember(projectId, selectedUserId, role).subscribe();
   ```

2. **Displaying Members**:
   ```typescript
   // Get project members (includes user details via JOIN)
   this.memberService.getMembers(projectId).subscribe(members => {
     // members array includes: userId, username, email, firstName, lastName, 
     // systemRole, projectRole, joinedAt
   });
   ```

3. **Available Users**:
   ```typescript
   // Get users not in project
   this.userService.getAvailableUsers(projectId).subscribe(users => {
     // Display in add member dialog
   });
   ```

## Recommendation

**Create a separate spec for the User/Member Management module** before proceeding with the Project Configuration Management implementation. This will ensure:

1. Clear separation of concerns
2. Proper dependency management
3. Ability to implement and test User Management independently
4. Reusability of User Management across other modules

### Suggested Spec Name
`user-member-management` or `user-administration`

### Suggested Approach
1. Create User Management spec (requirements → design → tasks)
2. Implement User Management module
3. Test User Management module
4. Then proceed with Project Configuration Management implementation

## Questions to Consider

1. **Should regular users be able to view the user list?**
   - Recommendation: Yes, for adding project members, but with limited information

2. **Should managers be able to create new users?**
   - Recommendation: No, only admin/superadmin should create users

3. **Should users be able to edit their own profiles?**
   - Recommendation: Yes, but limited fields (firstName, lastName, password)

4. **Should there be a user invitation system?**
   - Recommendation: Future enhancement - send email invitations to join

5. **Should deactivated users be removed from projects automatically?**
   - Recommendation: Yes, mark as inactive in project_members table

---

**Document Version**: 1.0  
**Created**: 2024-01-15  
**Status**: Dependency Analysis Complete
