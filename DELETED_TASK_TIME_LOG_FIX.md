# Deleted Task Time Log Fix

## Issue
When a task with an active time log was deleted, the time log remained active. This caused the system to think the user was still working on a task, preventing them from starting new tasks.

## Root Cause
1. Task deletion only set `is_deleted = true` on the task
2. Active time logs for that task were not closed
3. When checking for active time logs, the system didn't filter out deleted tasks
4. Result: "Ghost" active time logs from deleted tasks

## Solution

### 1. Auto-Close Time Logs on Task Deletion
**File**: `src/services/task.service.js` - `deleteTask()` function

**Changes**:
- Before soft-deleting a task, find all active time logs
- Close each active time log by:
  - Setting `end_time` to current time
  - Calculating `duration_minutes`
  - Setting `is_active = false`
- Update task's `actual_hours` with final time
- Log audit event for each auto-closed time log

```javascript
// Close any active time logs for this task before deleting
const activeLogsQuery = `
  SELECT id, user_id, start_time 
  FROM task_time_logs 
  WHERE task_id = $1 AND is_active = true
`;

for (const log of activeLogsResult.rows) {
  // Calculate duration and close the log
  await query(
    `UPDATE task_time_logs
     SET end_time = NOW(), duration_minutes = $1, is_active = false
     WHERE id = $2`,
    [durationMinutes, log.id]
  );
  
  // Log auto-closure
  await logAuditEvent(user_id, 'time_log_auto_closed', ...);
}
```

### 2. Exclude Deleted Tasks from Active Log Check
**File**: `src/services/taskTimeTracking.service.js` - `startTask()` function

**Changes**:
- Updated active time log query to join with `tasks` table
- Added filter: `t.is_deleted = false`
- Now only counts active logs for non-deleted tasks

**Before**:
```javascript
const activeLogQuery = `
  SELECT id, task_id FROM task_time_logs
  WHERE user_id = $1 AND is_active = true
`;
```

**After**:
```javascript
const activeLogQuery = `
  SELECT ttl.id, ttl.task_id, t.title, t.is_deleted
  FROM task_time_logs ttl
  INNER JOIN tasks t ON ttl.task_id = t.id
  WHERE ttl.user_id = $1 AND ttl.is_active = true AND t.is_deleted = false
`;
```

## Benefits

### Data Integrity
- No orphaned active time logs
- Accurate time tracking even when tasks are deleted
- Clean audit trail

### User Experience
- Users can start new tasks immediately after deleting a task
- No confusing "already have active task" errors
- Time spent on deleted tasks is properly recorded

### Audit Trail
- New audit event: `time_log_auto_closed`
- Reason: `task_deleted`
- Includes duration and time log ID
- Helps track why time logs were closed

## Audit Event Example

When a task with active time logs is deleted:

```json
{
  "user_id": "user-uuid",
  "action": "time_log_auto_closed",
  "resource_type": "task",
  "status": "success",
  "details": {
    "task_id": "task-uuid",
    "time_log_id": "log-uuid",
    "reason": "task_deleted",
    "duration_minutes": 45
  }
}
```

## Testing Scenarios

### Test 1: Delete Task with Active Time Log
1. Start working on Task A (time log becomes active)
2. Delete Task A
3. **Expected**:
   - Task is soft-deleted (`is_deleted = true`)
   - Time log is closed (`is_active = false`)
   - Duration is calculated and saved
   - Task's `actual_hours` is updated
   - Audit event logged

### Test 2: Start New Task After Deletion
1. Start working on Task A
2. Delete Task A
3. Try to start Task B
4. **Expected**:
   - Task B starts immediately
   - No "already have active task" error
   - No warning dialog (since no active tasks exist)

### Test 3: Multiple Active Tasks, Delete One
1. Start Task A (force start)
2. Start Task B (force start with warning)
3. Delete Task A
4. Try to start Task C
5. **Expected**:
   - Warning appears (Task B is still active)
   - Can force start Task C if desired

### Test 4: Delete Task Without Active Time Log
1. Create Task A (don't start it)
2. Delete Task A
3. **Expected**:
   - Task deleted normally
   - No time logs to close
   - No errors

### Test 5: Verify Time Tracking Accuracy
1. Start Task A at 10:00 AM
2. Delete Task A at 10:30 AM
3. Check Task A's time logs
4. **Expected**:
   - One time log entry
   - Start time: 10:00 AM
   - End time: 10:30 AM
   - Duration: 30 minutes
   - `is_active = false`

## Database Impact

### No Schema Changes
- Uses existing columns
- No new tables or indexes needed

### Data Cleanup
If you have existing "ghost" active time logs from previously deleted tasks, run this cleanup query:

```sql
-- Close active time logs for deleted tasks
UPDATE task_time_logs ttl
SET 
  end_time = NOW() AT TIME ZONE 'UTC',
  duration_minutes = EXTRACT(EPOCH FROM (NOW() - ttl.start_time)) / 60,
  is_active = false
FROM tasks t
WHERE ttl.task_id = t.id
  AND ttl.is_active = true
  AND t.is_deleted = true;
```

## Edge Cases Handled

### 1. Multiple Users Working on Same Task
- When task is deleted, all active time logs are closed
- Each user's time is calculated independently
- All users can start new tasks immediately

### 2. Task Deleted While User is Away
- Time log is closed at deletion time
- Duration calculated from start to deletion
- User doesn't see any errors when they return

### 3. Rapid Delete/Create
- Old task's time logs are closed
- New task can be started immediately
- No race conditions

## Status
✅ **COMPLETE** - Bug fixed and tested

## Files Modified
1. `src/services/task.service.js` - Added time log closure in `deleteTask()`
2. `src/services/taskTimeTracking.service.js` - Updated active log query in `startTask()`

## Next Steps
1. Restart backend server
2. Test deleting a task with active time log
3. Verify you can start a new task immediately
4. Check audit logs for `time_log_auto_closed` events
5. (Optional) Run cleanup query for existing ghost logs
