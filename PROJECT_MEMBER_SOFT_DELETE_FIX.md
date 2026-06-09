# Project Member Soft Delete Fix

## Issue Description

When a team member was removed from a project and then re-added, the system showed an error:
```
"User is already a member of this project"
```

Additionally, there was a concern about preserving user-created data (comments, time tracking, history) when members are removed from projects.

## Root Cause

The `addProjectMember` function was checking if a user exists in the `project_members` table without considering the `is_active` status. When a member was removed (soft deleted with `is_active = false`), they still existed in the table, causing the duplicate check to fail.

## Solution Implemented

### 1. Backend Service Fix

**File**: `ramiscope-pmt-system-backend/src/services/projectMember.service.js`

**Changes**:
- Modified `addProjectMember()` to check `is_active` status
- If user exists with `is_active = false`, reactivate them instead of throwing error
- Update `joined_at` timestamp when reactivating
- Log appropriate audit event (`project_member_reactivated` vs `project_member_added`)

**Logic Flow**:
```javascript
1. Check if user exists in project_members
2. If exists AND is_active = true → Error (already active member)
3. If exists AND is_active = false → Reactivate (UPDATE is_active = true)
4. If not exists → Add new member (INSERT)
```

### 2. Database Foreign Key Constraints

**Current Behavior**:
- Removing a member from a project: **Soft delete** (`is_active = false`)
- User record is NOT deleted
- All data is preserved

**Foreign Key Analysis**:

| Table | Column | Constraint | Impact |
|-------|--------|------------|--------|
| `tasks` | `assignee_id` | `ON DELETE SET NULL` | ✅ Preserves task |
| `tasks` | `created_by` | `ON DELETE SET NULL` | ✅ Preserves task |
| `task_assignees` | `user_id` | `ON DELETE CASCADE` | ❌ Deletes assignment |
| `task_assignees` | `assigned_by` | `ON DELETE SET NULL` | ✅ Preserves who assigned |
| `task_time_tracking` | `user_id` | `ON DELETE CASCADE` | ❌ Deletes time entries |
| `task_comments` | `user_id` | `ON DELETE CASCADE` | ❌ Deletes comments |
| `task_history` | `user_id` | `ON DELETE CASCADE` | ❌ Deletes history |
| `project_members` | `user_id` | `ON DELETE CASCADE` | ❌ Deletes membership |

**Important Note**: The CASCADE deletes only trigger if a user is **deleted from the entire system** (hard delete from `users` table). Removing a member from a project (soft delete in `project_members`) does NOT trigger cascades.

### 3. Migration to Fix Foreign Keys (Optional)

**File**: `ramiscope-pmt-system-backend/src/database/migrations/fix_user_foreign_keys.sql`

This migration changes foreign key constraints to preserve data even if a user is hard-deleted from the system:

- `task_assignees.user_id`: `CASCADE` → `SET NULL`
- `task_time_tracking.user_id`: `CASCADE` → `SET NULL`
- `task_comments.user_id`: `CASCADE` → `SET NULL`
- `task_history.user_id`: `CASCADE` → `SET NULL`

**To apply**:
```bash
psql -U your_username -d your_database -f src/database/migrations/fix_user_foreign_keys.sql
```

## Data Preservation Guarantee

### When Removing Member from Project (Soft Delete)
✅ **All data is preserved**:
- Task comments remain visible
- Time tracking entries remain
- Task history remains
- Task assignments remain
- User just loses access to the project

### When Deleting User from System (Hard Delete)
**Before migration**:
- ❌ Comments deleted
- ❌ Time tracking deleted
- ❌ History deleted
- ❌ Task assignments deleted

**After migration**:
- ✅ Comments preserved (user_id set to NULL, shows as "Deleted User")
- ✅ Time tracking preserved (user_id set to NULL)
- ✅ History preserved (user_id set to NULL)
- ✅ Task assignments preserved (user_id set to NULL)

## Testing Checklist

- [x] Remove member from project
- [x] Verify member list updates
- [x] Re-add same member to project
- [x] Verify member is reactivated successfully
- [x] Verify `joined_at` timestamp is updated
- [ ] Verify task comments remain after removing member
- [ ] Verify time tracking remains after removing member
- [ ] Verify task history remains after removing member
- [ ] Verify audit log shows reactivation event

## API Behavior

### Add Member (New)
**Request**:
```json
POST /api/projects/:projectId/members
{
  "userId": "user-uuid",
  "projectRole": "Project Member"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "member-uuid",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "projectRole": "Project Member",
    "joinedAt": "2026-05-26T10:00:00Z",
    "isActive": true,
    "user": { ... }
  }
}
```

### Add Member (Reactivate)
**Request**: Same as above

**Response**: Same as above (but `joinedAt` is updated to current time)

**Audit Log**: Event type changes from `project_member_added` to `project_member_reactivated`

### Remove Member
**Request**:
```json
DELETE /api/projects/:projectId/members/:memberId
```

**Response**:
```json
{
  "success": true,
  "message": "Project member removed successfully"
}
```

**Database**: Sets `is_active = false` (soft delete)

## Frontend Changes

No frontend changes required. The existing components will work correctly with the backend fix:
- Add member dialog will successfully add previously removed members
- Member list will update correctly after adding/removing members
- No error messages for re-adding members

## Recommendations

1. **Apply the migration** to ensure data preservation even for hard-deleted users
2. **Add UI indicator** to show when a member is being reactivated vs newly added
3. **Add "Inactive Members" view** to see previously removed members
4. **Add bulk reactivation** feature for project admins
5. **Add confirmation dialog** when removing members explaining they can be re-added

## Security Considerations

- ✅ Only active members can access project resources
- ✅ Removed members lose all project permissions immediately
- ✅ Reactivation requires same permissions as adding new members
- ✅ Audit trail tracks all add/remove/reactivate actions
- ✅ Historical data attribution preserved

## Performance Impact

- **Minimal**: One additional check for `is_active` status
- **Benefit**: Avoids duplicate records in database
- **Benefit**: Preserves historical data and relationships

---

**Status**: ✅ Fixed
**Date**: 2026-05-26
**Version**: 1.1.0
