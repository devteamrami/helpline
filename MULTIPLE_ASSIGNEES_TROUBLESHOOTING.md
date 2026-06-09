# Multiple Assignees Feature - Troubleshooting Guide

## Current Issue
- ✅ Material multi-select UI is working
- ❌ Assignees not showing in task list
- ❌ Assignees not showing in task detail
- ❌ Edit task shows no assignees selected

## Root Cause
The backend database might not have the `task_assignees` table, or existing tasks haven't been migrated to use it.

## Solution Steps

### Step 1: Run Verification Script

```bash
cd "c:\Users\soura\OneDrive\Desktop\Node js\ramiscope-pmt-system-backend"

# Run the verification script
psql -U postgres -d your_database_name -f src/database/migrations/verify_and_fix_assignees.sql
```

Replace `your_database_name` with your actual database name (check `.env` file for `DB_NAME`).

This script will:
1. ✅ Check if `task_assignees` table exists
2. ✅ Show current data status
3. ✅ Migrate existing single assignees to the new table
4. ✅ Test the query that backend uses
5. ✅ Show verification summary

### Step 2: If Table Doesn't Exist

If the script shows "❌ task_assignees table does NOT exist", run the migration:

```bash
cd "c:\Users\soura\OneDrive\Desktop\Node js\ramiscope-pmt-system-backend"
npm run migrate
```

Then run the verification script again (Step 1).

### Step 3: Restart Backend

```bash
cd "c:\Users\soura\OneDrive\Desktop\Node js\ramiscope-pmt-system-backend"
# Stop the server (Ctrl+C)
npm start
```

### Step 4: Test the Feature

1. **Open browser** → http://localhost:4200
2. **Go to a project** → Click "Add Task"
3. **Fill in task details**:
   - Title: "Test Multiple Assignees"
   - Select 2-3 team members from the dropdown
4. **Click "Create Task"**
5. **Check the task list** → Should show assignee badges
6. **Click on the task** → Should show all assignees in detail page
7. **Click Edit** → Should show selected assignees in the dropdown

### Step 5: Verify in Database

```sql
-- Check if assignees were inserted
SELECT 
    t.title,
    ta.user_id,
    u.username
FROM tasks t
JOIN task_assignees ta ON t.id = ta.task_id
JOIN users u ON ta.user_id = u.id
WHERE t.title = 'Test Multiple Assignees';
```

Should show multiple rows (one for each assignee).

### Step 6: Check API Response

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Click on a task** to open detail page
4. **Find the API call**: `GET /api/projects/{projectId}/tasks/{taskId}`
5. **Check the response** → Should include:

```json
{
  "success": true,
  "data": {
    "id": "task-id",
    "title": "Test Multiple Assignees",
    "assignees": [
      {
        "id": "user-id-1",
        "email": "user1@example.com",
        "username": "user1",
        "firstName": "First",
        "lastName": "Last"
      },
      {
        "id": "user-id-2",
        ...
      }
    ]
  }
}
```

## Common Issues and Fixes

### Issue 1: "task_assignees table does not exist"
**Fix**: Run the migration
```bash
npm run migrate
```

### Issue 2: Assignees array is empty `[]`
**Cause**: Data not inserted into `task_assignees` table
**Fix**: 
1. Check backend logs when creating task
2. Verify `task.service.js` has the insert code (line ~319-326)
3. Run verification script to migrate existing data

### Issue 3: API returns assignees but UI shows "Unassigned"
**Cause**: Frontend components not updated
**Fix**: Already fixed in the code - restart frontend:
```bash
cd "c:\Users\soura\OneDrive\Desktop\Angular\ramiscope-project-management-system"
# Stop server (Ctrl+C)
ng serve
```

### Issue 4: Edit task doesn't show selected assignees
**Cause**: Form not initializing with `assignees` array
**Fix**: Already fixed - the form now uses:
```typescript
assigneeIds: [task?.assignees?.map(a => a.id) || [], []]
```

## Files Changed

### Backend
1. ✅ `src/database/schema.sql` - Added `task_assignees` table
2. ✅ `src/database/migrations/add_task_assignees_table.sql` - Migration script
3. ✅ `src/services/task.service.js` - Updated to support multiple assignees
4. ✅ `src/database/migrations/verify_and_fix_assignees.sql` - Verification script

### Frontend
1. ✅ `src/app/core/models/task.model.ts` - Added `assignees` array
2. ✅ `src/app/features/tasks/task-form-dialog/*` - Material multi-select
3. ✅ `src/app/features/tasks/task-list/*` - Display multiple assignees
4. ✅ `src/app/features/tasks/task-detail/*` - Display multiple assignees

## Quick Checklist

- [ ] Run verification script
- [ ] Check if `task_assignees` table exists
- [ ] Run migration if needed
- [ ] Restart backend server
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Restart frontend server
- [ ] Create test task with 2+ assignees
- [ ] Verify assignees show in list
- [ ] Verify assignees show in detail
- [ ] Verify edit shows selected assignees
- [ ] Check API response in Network tab
- [ ] Check database has records in `task_assignees`

## Expected Behavior

### Task List
```
TITLE                    ASSIGNEES
Dashboard Optimization   [SG] Sourav Ghosh  [SA] Super Admin
```

### Task Detail
```
Assignees:
  [SG] Sourav Ghosh (sourav@example.com)
  [SA] Super Admin (superadmin@ramiscope.com)
```

### Edit Task
```
Assignees: [2 team members selected ▼]
  ✓ Sourav Ghosh
  ✓ Super Admin
```

## Need Help?

If the issue persists after following all steps:

1. **Check backend logs** for errors
2. **Check browser console** for errors
3. **Run the verification script** and share the output
4. **Check Network tab** and share the API response
5. **Check database** and share the query results

---

**Last Updated**: 2026-05-26
**Status**: Troubleshooting Guide Complete
