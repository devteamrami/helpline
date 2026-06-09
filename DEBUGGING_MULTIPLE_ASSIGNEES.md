# Debugging Multiple Assignees Feature

## Issue
- Creating task with multiple assignees shows "Unassigned" in list
- Task detail page shows "Unassigned"
- Edit task shows no users selected

## Debugging Steps

### 1. Check if Migration Ran
Run this SQL query in your database:
```sql
-- Check if task_assignees table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'task_assignees'
);

-- Check if there are any records
SELECT COUNT(*) FROM task_assignees;

-- Check the structure
\d task_assignees
```

### 2. Check Backend API Response
Open browser DevTools (F12) → Network tab → Create a task with 2 assignees

**Check the CREATE request**:
```
POST /api/projects/{projectId}/tasks
Payload should include:
{
  "title": "Test Task",
  "assigneeIds": ["user-id-1", "user-id-2"]
}
```

**Check the GET response**:
```
GET /api/projects/{projectId}/tasks/{taskId}
Response should include:
{
  "id": "task-id",
  "title": "Test Task",
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
```

### 3. Check Database After Creating Task
```sql
-- Check if task was created
SELECT id, title, assignee_id FROM tasks 
WHERE title = 'Test Task';

-- Check if assignees were inserted
SELECT ta.*, u.username 
FROM task_assignees ta
JOIN users u ON ta.user_id = u.id
WHERE ta.task_id = 'your-task-id';
```

### 4. Check Backend Logs
Look for these log messages in your backend console:
```
✅ Task created successfully
✅ Assignees added to task_assignees table
```

### 5. Common Issues and Fixes

#### Issue 1: Migration Not Run
**Symptom**: Table `task_assignees` doesn't exist
**Fix**:
```bash
cd ramiscope-pmt-system-backend
npm run migrate
```

#### Issue 2: Backend Not Inserting Assignees
**Symptom**: Task created but no records in `task_assignees`
**Check**: `src/services/task.service.js` - `createTask()` function
**Look for**:
```javascript
// Add all assignees to task_assignees table
if (assignees.length > 0) {
  for (const assigneeUserId of assignees) {
    await query(
      'INSERT INTO task_assignees (task_id, user_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (task_id, user_id) DO NOTHING',
      [task.id, assigneeUserId, userId]
    );
  }
}
```

#### Issue 3: Backend Not Returning Assignees
**Symptom**: Task created, records in `task_assignees`, but API doesn't return them
**Check**: `src/services/task.service.js` - `getTaskById()` and `getTasks()` functions
**Look for**:
```javascript
COALESCE(
  (
    SELECT json_agg(json_build_object(
      'id', ta_u.id,
      'email', ta_u.email,
      'username', ta_u.username,
      'firstName', ta_u.first_name,
      'lastName', ta_u.last_name
    ) ORDER BY ta.assigned_at)
    FROM task_assignees ta
    JOIN users ta_u ON ta.user_id = ta_u.id
    WHERE ta.task_id = t.id
  ),
  '[]'::json
) as assignees
```

#### Issue 4: Frontend Not Sending assigneeIds
**Symptom**: Backend receives empty array or undefined
**Check**: Browser DevTools → Network → Request Payload
**Should see**:
```json
{
  "title": "Test Task",
  "assigneeIds": ["uuid-1", "uuid-2"]
}
```

**If missing, check**: `task-form-dialog.component.ts` - `onSubmit()` method
```typescript
const taskData = {
  title: formValue.title,
  assigneeIds: formValue.assigneeIds || [],  // Should be array
  ...
};
```

#### Issue 5: Frontend Not Displaying Assignees
**Symptom**: API returns assignees but UI shows "Unassigned"
**Check**: Browser Console for errors
**Check**: `task.model.ts` - Task interface should have:
```typescript
assignees?: TaskAssignee[];
```

**Check**: Components are using `task.assignees` not `task.assignee`

### 6. Quick Test Script

Run this in your database to manually test:

```sql
-- 1. Create a test task
INSERT INTO tasks (project_id, title, created_by, status, priority)
VALUES ('your-project-id', 'Manual Test Task', 'your-user-id', 'To Do', 'Medium')
RETURNING id;

-- 2. Add assignees (use the task ID from above)
INSERT INTO task_assignees (task_id, user_id, assigned_by)
VALUES 
  ('task-id-from-above', 'user-id-1', 'your-user-id'),
  ('task-id-from-above', 'user-id-2', 'your-user-id');

-- 3. Query to see if it works
SELECT 
  t.id,
  t.title,
  COALESCE(
    (
      SELECT json_agg(json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
      ))
      FROM task_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = t.id
    ),
    '[]'::json
  ) as assignees
FROM tasks t
WHERE t.id = 'task-id-from-above';
```

### 7. Expected Flow

1. **User selects 2 assignees** in Material multi-select
2. **Form value**: `assigneeIds: ["uuid-1", "uuid-2"]`
3. **POST request** sends `assigneeIds` array to backend
4. **Backend creates task** with first assignee as `assignee_id`
5. **Backend inserts** both assignees into `task_assignees` table
6. **GET request** returns task with `assignees` array
7. **Frontend displays** assignee badges in list and detail page

### 8. Restart Checklist

If nothing works, try this sequence:

1. **Stop backend server** (Ctrl+C)
2. **Run migration**:
   ```bash
   cd ramiscope-pmt-system-backend
   npm run migrate
   ```
3. **Restart backend**:
   ```bash
   npm start
   ```
4. **Stop frontend server** (Ctrl+C)
5. **Clear browser cache** (Ctrl+Shift+Delete)
6. **Restart frontend**:
   ```bash
   cd ramiscope-project-management-system
   ng serve
   ```
7. **Hard refresh browser** (Ctrl+Shift+R)
8. **Create new task** with 2 assignees
9. **Check Network tab** for API responses

---

## Quick Verification Commands

```bash
# Backend - Check if migration ran
cd ramiscope-pmt-system-backend
npm run migrate

# Database - Check table exists
psql -U your_username -d your_database -c "\dt task_assignees"

# Database - Check data
psql -U your_username -d your_database -c "SELECT * FROM task_assignees LIMIT 5;"
```

## Contact Points for Issues

1. **Migration not running**: Check `src/database/runMigration.js`
2. **Backend not inserting**: Check `src/services/task.service.js` - `createTask()`
3. **Backend not returning**: Check `src/services/task.service.js` - `getTaskById()` and `getTasks()`
4. **Frontend not sending**: Check `task-form-dialog.component.ts` - `onSubmit()`
5. **Frontend not displaying**: Check `task-list.component.html` and `task-detail.component.html`
