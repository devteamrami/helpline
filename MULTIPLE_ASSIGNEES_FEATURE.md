# Multiple Task Assignees Feature

## Overview
This document outlines the implementation of multiple assignees per task feature. Currently, tasks can only have one assignee, but this feature allows assigning multiple team members to a single task.

## Database Changes

### New Table: `task_assignees`
A junction table that creates a many-to-many relationship between tasks and users.

```sql
CREATE TABLE task_assignees (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    user_id UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(task_id, user_id)
);
```

### Backward Compatibility
- The existing `tasks.assignee_id` column is **kept** for backward compatibility
- It represents the "primary" assignee
- The `task_assignees` table stores **all** assignees (including the primary one)

## Migration Steps

### 1. Run Database Migration
```bash
cd ramiscope-pmt-system-backend
psql -U your_username -d your_database -f src/database/migrations/add_task_assignees_table.sql
```

This will:
- Create the `task_assignees` table
- Migrate existing single assignees to the new table
- Create necessary indexes

### 2. Backend API Changes Needed

#### A. Create Task Assignees Service
**File:** `ramiscope-pmt-system-backend/src/services/taskAssignees.service.js`

```javascript
const pool = require('../config/database');

class TaskAssigneesService {
  /**
   * Get all assignees for a task
   */
  async getTaskAssignees(taskId) {
    const query = `
      SELECT 
        ta.id,
        ta.task_id,
        ta.user_id,
        ta.assigned_at,
        ta.assigned_by,
        u.email,
        u.username,
        u.first_name,
        u.last_name
      FROM task_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
      ORDER BY ta.assigned_at ASC
    `;
    
    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Add assignees to a task
   */
  async addTaskAssignees(taskId, userIds, assignedBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const assignees = [];
      for (const userId of userIds) {
        const query = `
          INSERT INTO task_assignees (task_id, user_id, assigned_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (task_id, user_id) DO NOTHING
          RETURNING *
        `;
        
        const result = await client.query(query, [taskId, userId, assignedBy]);
        if (result.rows.length > 0) {
          assignees.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      return assignees;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove an assignee from a task
   */
  async removeTaskAssignee(taskId, userId) {
    const query = `
      DELETE FROM task_assignees
      WHERE task_id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [taskId, userId]);
    return result.rows[0];
  }

  /**
   * Replace all assignees for a task
   */
  async replaceTaskAssignees(taskId, userIds, assignedBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove all existing assignees
      await client.query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);
      
      // Add new assignees
      const assignees = [];
      for (const userId of userIds) {
        const query = `
          INSERT INTO task_assignees (task_id, user_id, assigned_by)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        const result = await client.query(query, [taskId, userId, assignedBy]);
        assignees.push(result.rows[0]);
      }
      
      // Update primary assignee (first one in the list)
      if (userIds.length > 0) {
        await client.query(
          'UPDATE tasks SET assignee_id = $1 WHERE id = $2',
          [userIds[0], taskId]
        );
      } else {
        await client.query(
          'UPDATE tasks SET assignee_id = NULL WHERE id = $2',
          [taskId]
        );
      }
      
      await client.query('COMMIT');
      return assignees;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new TaskAssigneesService();
```

#### B. Update Task Service
**File:** `ramiscope-pmt-system-backend/src/services/task.service.js`

Modify the `getTaskById` method to include all assignees:

```javascript
async getTaskById(projectId, taskId) {
  const query = `
    SELECT 
      t.*,
      u.email as assignee_email,
      u.username as assignee_username,
      u.first_name as assignee_first_name,
      u.last_name as assignee_last_name,
      creator.username as creator_username,
      -- Get all assignees as JSON array
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'id', ta_u.id,
            'email', ta_u.email,
            'username', ta_u.username,
            'firstName', ta_u.first_name,
            'lastName', ta_u.last_name
          ))
          FROM task_assignees ta
          JOIN users ta_u ON ta.user_id = ta_u.id
          WHERE ta.task_id = t.id
        ),
        '[]'::json
      ) as assignees
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.project_id = $1 AND t.id = $2 AND t.is_deleted = false
  `;
  
  const result = await pool.query(query, [projectId, taskId]);
  return result.rows[0];
}
```

#### C. Create API Routes
**File:** `ramiscope-pmt-system-backend/src/routes/taskAssignees.routes.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const taskAssigneesService = require('../services/taskAssignees.service');
const { authenticate } = require('../middleware/auth.middleware');

// Get all assignees for a task
router.get('/', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const assignees = await taskAssigneesService.getTaskAssignees(taskId);
    
    res.json({
      success: true,
      data: { assignees }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add assignees to a task
router.post('/', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userIds } = req.body;
    const assignedBy = req.user.id;
    
    const assignees = await taskAssigneesService.addTaskAssignees(
      taskId,
      userIds,
      assignedBy
    );
    
    res.json({
      success: true,
      data: { assignees },
      message: 'Assignees added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Replace all assignees for a task
router.put('/', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userIds } = req.body;
    const assignedBy = req.user.id;
    
    const assignees = await taskAssigneesService.replaceTaskAssignees(
      taskId,
      userIds,
      assignedBy
    );
    
    res.json({
      success: true,
      data: { assignees },
      message: 'Assignees updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove an assignee from a task
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    
    await taskAssigneesService.removeTaskAssignee(taskId, userId);
    
    res.json({
      success: true,
      message: 'Assignee removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

Register the routes in your main app file:
```javascript
app.use('/api/v1/projects/:projectId/tasks/:taskId/assignees', taskAssigneesRoutes);
```

### 3. Frontend Changes Needed

#### A. Update Task Model
**File:** `src/app/core/models/task.model.ts`

```typescript
export interface TaskAssignee {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;  // Primary assignee (backward compatibility)
  assignee?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  assignees?: TaskAssignee[];  // NEW: All assignees
  createdBy?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### B. Update Task Form Dialog
**File:** `src/app/features/tasks/task-form-dialog/task-form-dialog.component.ts`

Change the assignee field from a single select to a multi-select:

```typescript
// Change form control
this.taskForm = this.fb.group({
  title: [task?.title || '', [Validators.required]],
  description: [task?.description || ''],
  status: [task?.status || 'To Do', [Validators.required]],
  priority: [task?.priority || 'Medium', [Validators.required]],
  assigneeIds: [task?.assignees?.map(a => a.id) || [], []],  // Changed to array
  dueDate: [task?.dueDate || ''],
  estimatedHours: [task?.estimatedHours || '']
});
```

**File:** `src/app/features/tasks/task-form-dialog/task-form-dialog.component.html`

Replace the single select with a multi-select:

```html
<!-- Multiple Assignees -->
<div class="form-group">
  <label for="assigneeIds">Assignees</label>
  <select 
    id="assigneeIds"
    formControlName="assigneeIds"
    multiple
    size="5"
    [disabled]="isLoadingMembers">
    <option *ngFor="let member of projectMembers" [value]="member.id">
      {{ getMemberDisplayName(member) }}
    </option>
  </select>
  <div class="field-hint">
    Hold Ctrl (Windows) or Cmd (Mac) to select multiple team members
  </div>
  <div *ngIf="isLoadingMembers" class="field-hint">
    Loading project members...
  </div>
</div>
```

Add CSS for better multi-select styling:

```scss
select[multiple] {
  height: auto;
  min-height: 120px;
  padding: 8px;
  
  option {
    padding: 6px 8px;
    margin: 2px 0;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    &:checked {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 500;
    }
  }
}
```

#### C. Update Task Service
**File:** `src/app/core/services/task.service.ts`

Update the create/update methods to handle multiple assignees:

```typescript
createTask(projectId: string, taskData: any): Observable<Task> {
  const payload = {
    ...taskData,
    assigneeId: taskData.assigneeIds?.[0],  // First one is primary
    assigneeIds: taskData.assigneeIds  // All assignees
  };
  
  return this.http.post<ApiResponse<Task>>(
    `${this.apiUrl}/projects/${projectId}/tasks`,
    payload
  ).pipe(
    map(response => response.data!)
  );
}
```

#### D. Display Multiple Assignees in Task List
**File:** `src/app/features/tasks/task-list/task-list.component.html`

Update the assignee column to show multiple assignees:

```html
<td class="assignee-cell">
  <div class="assignees-list" *ngIf="task.assignees && task.assignees.length > 0">
    <span class="assignee-badge" *ngFor="let assignee of task.assignees">
      {{ getAssigneeInitials(assignee) }}
    </span>
    <span class="assignee-names">
      {{ getAssigneeNames(task) }}
    </span>
  </div>
  <span *ngIf="!task.assignees || task.assignees.length === 0" class="unassigned">
    Unassigned
  </span>
</td>
```

Add helper methods:

```typescript
getAssigneeInitials(assignee: TaskAssignee): string {
  if (assignee.firstName && assignee.lastName) {
    return `${assignee.firstName[0]}${assignee.lastName[0]}`.toUpperCase();
  }
  return assignee.username[0].toUpperCase();
}

getAssigneeNames(task: Task): string {
  if (!task.assignees || task.assignees.length === 0) {
    return 'Unassigned';
  }
  
  return task.assignees.map(a => {
    if (a.firstName && a.lastName) {
      return `${a.firstName} ${a.lastName}`;
    }
    return a.username;
  }).join(', ');
}
```

Add CSS for assignee badges:

```scss
.assignees-list {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .assignee-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 11px;
    font-weight: 600;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &:not(:first-child) {
      margin-left: -8px;
    }
  }
  
  .assignee-names {
    margin-left: 8px;
    font-size: 13px;
    color: #4a5568;
  }
}
```

## Testing Steps

### 1. Database Migration
```bash
# Run the migration
psql -U postgres -d ramiscope_pms -f src/database/migrations/add_task_assignees_table.sql

# Verify the table was created
psql -U postgres -d ramiscope_pms -c "\d task_assignees"

# Check existing data was migrated
psql -U postgres -d ramiscope_pms -c "SELECT COUNT(*) FROM task_assignees"
```

### 2. Backend Testing
```bash
# Test getting task assignees
curl -X GET http://localhost:5000/api/v1/projects/{projectId}/tasks/{taskId}/assignees \
  -H "Authorization: Bearer {token}"

# Test adding multiple assignees
curl -X POST http://localhost:5000/api/v1/projects/{projectId}/tasks/{taskId}/assignees \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-id-1", "user-id-2", "user-id-3"]}'

# Test removing an assignee
curl -X DELETE http://localhost:5000/api/v1/projects/{projectId}/tasks/{taskId}/assignees/{userId} \
  -H "Authorization: Bearer {token}"
```

### 3. Frontend Testing
1. Open a project detail page
2. Click "Add Task"
3. In the Assignees dropdown, select multiple team members (Ctrl+Click or Cmd+Click)
4. Create the task
5. Verify all selected assignees appear in the task list
6. Edit the task and verify all assignees are pre-selected
7. Remove some assignees and save
8. Verify the changes are reflected

## Benefits

1. **Team Collaboration**: Multiple team members can work on the same task
2. **Better Visibility**: Everyone assigned to a task gets notifications
3. **Flexible Assignment**: Can have a primary assignee plus supporting team members
4. **Backward Compatible**: Existing single-assignee tasks continue to work
5. **Audit Trail**: Tracks who assigned whom and when

## Future Enhancements

1. **Assignee Roles**: Add roles like "Lead", "Reviewer", "Contributor"
2. **Workload Distribution**: Show how many tasks each team member is assigned to
3. **Notifications**: Notify all assignees when task status changes
4. **Time Tracking**: Track time per assignee
5. **Permissions**: Allow assignees to edit task details

## Rollback Plan

If you need to rollback this feature:

```sql
-- Remove the task_assignees table
DROP TABLE IF EXISTS task_assignees CASCADE;

-- The tasks table remains unchanged, so existing functionality continues to work
```

## Summary

This feature adds comprehensive support for multiple task assignees while maintaining backward compatibility with the existing single-assignee system. The implementation uses a junction table pattern which is scalable and follows database best practices.
