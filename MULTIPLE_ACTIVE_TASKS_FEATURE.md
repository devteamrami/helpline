# Multiple Active Tasks Feature

## Overview
Users can now work on multiple tasks simultaneously with a warning system that informs them about the potential impact on time tracking accuracy.

## User Flow

### Scenario 1: Starting First Task
1. User clicks "Start" on a task
2. Task starts immediately
3. Success toast notification appears
4. Time tracking begins

### Scenario 2: Starting Second Task (While One is Active)
1. User clicks "Start" on a different task
2. **Warning Dialog Appears**:
   - Icon: Warning (yellow)
   - Title: "Active Task Detected"
   - Message:
     - "⚠️ You already have an active task running."
     - "Working on multiple tasks simultaneously may affect time tracking accuracy."
     - "**Recommendation:** Pause your current task before starting a new one for accurate time tracking."
     - "Do you want to continue anyway?"
   - Buttons:
     - "Yes, Start Anyway" (orange button)
     - "No, Cancel" (gray button)

3. **If User Clicks "Yes, Start Anyway"**:
   - New task starts
   - User now has 2 active tasks
   - Info toast notification: "You now have multiple active tasks. Remember to track your time accurately."
   - Both tasks show as "In Progress"

4. **If User Clicks "No, Cancel"**:
   - Dialog closes
   - No new task started
   - User continues with current active task

## Technical Implementation

### Frontend Changes

#### 1. Time Tracking Widget Component
**File**: `src/app/features/tasks/time-tracking-widget/time-tracking-widget.component.ts`

**Changes**:
- Updated `onStartTask()` method to handle "active task" error
- Shows SweetAlert2 confirmation dialog with warning
- Calls service with `force: true` parameter if user confirms

```typescript
if (result.isConfirmed) {
  await this.timeTrackingService.startTask(this.projectId, this.taskId, true).toPromise();
  // Shows info toast about multiple active tasks
}
```

#### 2. Task Time Tracking Service
**File**: `src/app/core/services/task-time-tracking.service.ts`

**Changes**:
- Added `force` parameter to `startTask()` method
- Sends `{ force: true }` in request body when forcing start

```typescript
startTask(projectId: string, taskId: string, force: boolean = false): Observable<{ timeLog: TimeLog }> {
  const body = force ? { force: true } : {};
  return this.http.post(url, body);
}
```

### Backend Changes

#### 1. Time Tracking Controller
**File**: `src/controllers/taskTimeTracking.controller.js`

**Changes**:
- Extracts `force` parameter from request body
- Passes it to service layer

```javascript
const { force } = req.body;
const timeLog = await taskTimeTrackingService.startTask(taskId, userId, force, auditInfo);
```

#### 2. Time Tracking Service
**File**: `src/services/taskTimeTracking.service.js`

**Changes**:
- Added `force` parameter to `startTask()` function
- Only throws "active task" error if `force === false`
- Logs additional context when forcing start (multiple active tasks)
- Adds special comment and history entry when starting with force

```javascript
const startTask = async (taskId, userId, force = false, auditInfo = {}) => {
  // Check for active tasks
  if (activeLogResult.rows.length > 0 && !force) {
    throw new Error('You already have an active time log...');
  }
  
  // Allow starting if force === true
  // Log special comment: "Started working (multiple active tasks)"
}
```

## Benefits

### For Users
1. **Flexibility**: Can work on multiple tasks when needed (e.g., waiting for builds, context switching)
2. **Informed Decision**: Clear warning about time tracking accuracy
3. **Recommendation**: System suggests best practice (pause before starting new)
4. **Control**: User decides whether to proceed or not

### For Managers
1. **Visibility**: Can see when users are working on multiple tasks
2. **Audit Trail**: History shows "multiple active tasks" entries
3. **Time Tracking**: All time is still tracked, just distributed across tasks

## Warning Dialog Design

### Visual Elements
- **Icon**: Yellow warning triangle
- **Title**: Bold, clear "Active Task Detected"
- **Content**: Left-aligned, structured with:
  - Warning emoji (⚠️)
  - Clear problem statement
  - Impact explanation
  - Recommendation (bold)
  - Question prompt
- **Buttons**:
  - Primary (orange): "Yes, Start Anyway"
  - Secondary (gray): "No, Cancel"
  - Reversed order (Cancel on right)

### Color Scheme
- Confirm button: Orange (#f59e0b) - indicates caution
- Cancel button: Gray (#6c757d) - neutral
- Matches app's gradient theme

## Database Impact

### No Schema Changes Required
- Existing `task_time_logs` table supports multiple active logs per user
- No unique constraint on `(user_id, is_active)`
- System already designed to handle this scenario

### Audit Trail
When user forces start with active tasks:
```json
{
  "task_id": "uuid",
  "time_log_id": "uuid",
  "forced": true,
  "active_tasks_count": 2
}
```

### History Entry
- Action: "started"
- New Value: "Started working (multiple active tasks)"

### Comment Entry
- Type: "work_update"
- Text: "Started working on this task (working on multiple tasks simultaneously)"

## Testing Scenarios

### Test 1: Normal Start (No Active Tasks)
1. User has no active tasks
2. Click "Start" on Task A
3. **Expected**: Task starts immediately, no warning

### Test 2: Warning Dialog Appears
1. User has Task A active
2. Click "Start" on Task B
3. **Expected**: Warning dialog appears with proper message

### Test 3: User Cancels
1. Warning dialog is shown
2. Click "No, Cancel"
3. **Expected**: Dialog closes, Task B not started, Task A still active

### Test 4: User Confirms (Multiple Active)
1. Warning dialog is shown
2. Click "Yes, Start Anyway"
3. **Expected**:
   - Task B starts
   - Info toast appears
   - Both Task A and Task B show as active
   - History shows "multiple active tasks" entry

### Test 5: Three Active Tasks
1. User has Task A and Task B active
2. Click "Start" on Task C
3. **Expected**: Warning still appears, can start Task C

### Test 6: Pause One, Start Another
1. User has Task A active
2. Pause Task A
3. Start Task B
4. **Expected**: No warning, Task B starts normally

## Time Tracking Accuracy

### How It Works
- Each task has its own time log
- Time logs run independently
- When user pauses a task, only that task's time log stops
- Actual hours = sum of all time log durations for that task

### Potential Issues
- If user works on Task A and Task B simultaneously, both accumulate time
- Total time tracked may exceed actual work time
- Example: 1 hour of real work = 1 hour on Task A + 1 hour on Task B = 2 hours tracked

### Mitigation
- Warning dialog educates users
- Recommendation to pause before starting new task
- History and comments show when multiple tasks were active
- Managers can review and adjust if needed

## Status
✅ **COMPLETE** - Feature implemented and ready for testing

## Next Steps
1. Restart backend server
2. Test the warning dialog flow
3. Verify multiple active tasks work correctly
4. Check history and comments show proper entries
5. Test time tracking accuracy with multiple active tasks
