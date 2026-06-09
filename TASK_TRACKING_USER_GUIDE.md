# Task Tracking User Guide

## Quick Start Guide for Time Tracking & Task Management

---

## 📋 Table of Contents
1. [Creating Tasks](#creating-tasks)
2. [Time Tracking](#time-tracking)
3. [Adding Comments](#adding-comments)
4. [Viewing History](#viewing-history)
5. [Understanding Progress](#understanding-progress)
6. [Tips & Best Practices](#tips--best-practices)

---

## Creating Tasks

### How to Create a Task

1. **Navigate to Project**
   - Go to Projects from the sidebar
   - Click on the project you want to add a task to

2. **Open Task Form**
   - Click the "Add Task" button (purple gradient button)

3. **Fill in Task Details**
   - **Title** (required): Brief description of the task
   - **Description** (optional): Detailed information about what needs to be done
   - **Status**: Select from To Do, In Progress, In Review, Done, or Blocked
   - **Priority**: Select from Low, Medium, High, or Critical
   - **Assignee**: Select who will work on this task
   - **Due Date** (optional): When the task should be completed
   - **Estimated Hours** (optional): How long you think the task will take

4. **Save**
   - Click "Create Task" button

### Estimated Hours Guidelines

- Use 0.5 hour increments (0.5, 1, 1.5, 2, etc.)
- Be realistic - it's better to overestimate slightly
- Consider:
  - Complexity of the task
  - Your familiarity with the technology
  - Potential blockers
  - Testing and review time

**Examples:**
- Simple bug fix: 0.5 - 1 hour
- Small feature: 2 - 4 hours
- Medium feature: 4 - 8 hours
- Large feature: 8 - 16 hours

---

## Time Tracking

### Starting Work on a Task

1. **Open Task Detail**
   - Click on the task title in the task list
   - This opens the detailed task view

2. **Start Working**
   - Click the green "Start Working" button
   - Timer will begin counting automatically
   - You'll see a message: "You are currently working on this task"

**Requirements:**
- ✅ You must be assigned to the task
- ✅ You can only work on one task at a time
- ✅ Task cannot be in "Done" status

### Pausing Work

1. **Click Pause Button**
   - Click the orange "Pause Work" button while timer is running

2. **Enter Pause Reason**
   - A dialog will appear
   - Select reason from dropdown:
     - Break
     - Meeting
     - Blocked
     - Other
   - Add optional notes
   - Click "Pause"

3. **Time Logged**
   - Your work time is automatically saved
   - Actual hours are updated
   - You can resume work later

### Completing a Task

1. **Click Complete Button**
   - Click the blue "Complete Task" button

2. **Enter Completion Notes**
   - A dialog will appear
   - Add notes about what was completed
   - Describe any testing done
   - Mention any issues encountered
   - Click "Complete"

3. **Task Marked Done**
   - Task status changes to "Done"
   - Final time is logged
   - Actual hours are finalized

### Understanding Actual Hours

**Actual hours are automatically calculated from your time logs:**
- Each time you start and pause/complete work, a time log is created
- The system calculates the duration of each work session
- All durations are summed to give total actual hours
- You cannot manually edit actual hours

**Example:**
- Start: 9:00 AM, Pause: 10:30 AM → 1.5 hours logged
- Start: 2:00 PM, Complete: 4:00 PM → 2 hours logged
- **Total Actual Hours: 3.5 hours**

---

## Adding Comments

### Comment Types

The system supports 6 types of comments:

1. **General** 💬
   - Regular comments and discussions
   - Questions and answers
   - General updates

2. **Work Update** 📝
   - Progress updates
   - What you've accomplished
   - Current status

3. **Blocker** 🚫
   - Issues preventing progress
   - Dependencies waiting on others
   - Technical problems

4. **Pause Reason** ⏸️
   - Automatically created when you pause work
   - Explains why work was paused

5. **Testing** 🧪
   - Test results
   - QA feedback
   - Bug reports

6. **Manual Hours** ⏱️
   - For logging time worked outside the system
   - Adjustments to time tracking

### How to Add a Comment

1. **Go to Comments Tab**
   - Open task detail page
   - Click on "Comments" tab

2. **Write Comment**
   - Type your comment in the text area
   - Select comment type from dropdown
   - Click "Add Comment"

3. **View Comments**
   - Comments appear in chronological order
   - Newest comments at the top
   - Each comment shows:
     - Author name and avatar
     - Comment type badge
     - Timestamp
     - Comment text

### Editing/Deleting Comments

- **Edit**: Click the edit icon (✏️) on your own comments
- **Delete**: Click the delete icon (🗑️) on your own comments
- You can only edit/delete your own comments

---

## Viewing History

### What's Tracked

The system automatically tracks all changes to a task:

1. **Task Created** - When the task was first created
2. **Task Updated** - Any changes to title, description, etc.
3. **Status Changed** - When status changes (To Do → In Progress, etc.)
4. **Assigned** - When someone is assigned to the task
5. **Unassigned** - When someone is removed from the task
6. **Started** - When work begins on the task
7. **Paused** - When work is paused
8. **Completed** - When task is marked done
9. **Comment Added** - When a comment is posted
10. **Time Logged** - When a time log is created

### How to View History

1. **Go to History Tab**
   - Open task detail page
   - Click on "History" tab

2. **View Timeline**
   - Events are shown in chronological order
   - Each event shows:
     - Action type icon
     - Description of what happened
     - Who performed the action
     - When it happened
     - Additional details (if applicable)

### Using History

**Use history to:**
- Track task progress over time
- See who worked on the task
- Understand why changes were made
- Audit compliance
- Debug issues
- Review team activity

---

## Understanding Progress

### Progress Indicators

#### 1. Hours Summary Cards
Located at the top of the task detail page:

- **Estimated Hours** ⏰
  - How long the task is expected to take
  - Set when creating/editing the task

- **Actual Hours** ⏱️
  - How long has actually been spent
  - Auto-calculated from time logs

- **Progress** 📈
  - Percentage: (Actual / Estimated) × 100
  - Shows how much of estimated time is used

- **Variance** ↔️
  - Difference: Actual - Estimated
  - Positive = over estimate (red)
  - Negative = under estimate (green)

#### 2. Progress Bar
Large visual indicator showing progress:

**Color Coding:**
- 🟢 **Green (0-49%)** - On track, plenty of time left
- 🟠 **Orange (50-74%)** - Moderate progress, watch closely
- 🔴 **Red (75-99%)** - High usage, may exceed estimate
- 🟣 **Purple (100%+)** - Complete or over estimate

#### 3. Task List Progress
In the project task list, each task shows:
- Estimated hours column
- Actual hours column
- Progress bar with percentage
- Color-coded indicator

### Interpreting Progress

**Healthy Progress:**
```
Estimated: 8h
Actual: 3h
Progress: 38% (Green)
Status: In Progress
```
Task is on track, 5 hours remaining.

**Warning Signs:**
```
Estimated: 4h
Actual: 3.5h
Progress: 88% (Red)
Status: In Progress
```
Task is almost at estimate but not complete. May need more time.

**Over Estimate:**
```
Estimated: 6h
Actual: 7.5h
Progress: 125% (Purple)
Status: Done
Variance: +1.5h
```
Task took longer than estimated. Use this data for future estimates.

---

## Tips & Best Practices

### Time Tracking Best Practices

1. **Start Timer Immediately**
   - Start the timer as soon as you begin work
   - Don't forget to start it!

2. **Pause When Interrupted**
   - Pause for meetings, breaks, or context switches
   - Add meaningful pause reasons
   - This keeps time tracking accurate

3. **Complete When Done**
   - Mark task complete when finished
   - Add completion notes for team visibility
   - Don't leave tasks "In Progress" indefinitely

4. **One Task at a Time**
   - Focus on one task at a time
   - Complete or pause before starting another
   - This improves accuracy and productivity

### Estimation Best Practices

1. **Break Down Large Tasks**
   - If estimate is > 16 hours, consider breaking into smaller tasks
   - Smaller tasks are easier to estimate accurately
   - Provides better progress visibility

2. **Learn from History**
   - Review your completed tasks
   - Compare estimated vs actual hours
   - Adjust future estimates based on patterns

3. **Include Buffer Time**
   - Add 20-30% buffer for unknowns
   - Account for testing and review
   - Better to finish early than late

4. **Update Estimates**
   - If you realize estimate is wrong, update it
   - Add a comment explaining why
   - This helps with project planning

### Collaboration Best Practices

1. **Use Comments Effectively**
   - Post work updates regularly
   - Document blockers immediately
   - Ask questions early
   - Share test results

2. **Choose Right Comment Type**
   - Use "Blocker" for urgent issues
   - Use "Work Update" for progress
   - Use "Testing" for QA feedback
   - This helps team prioritize

3. **Be Descriptive**
   - Write clear, detailed comments
   - Include relevant context
   - Link to related resources
   - Future you will thank you!

4. **Review History**
   - Check history before asking questions
   - Understand what's already been tried
   - Learn from past decisions

### Progress Monitoring

1. **Check Progress Daily**
   - Review your active tasks each morning
   - Identify tasks at risk of going over estimate
   - Communicate early if you need help

2. **Update Status Regularly**
   - Keep task status current
   - Move to "In Review" when ready
   - Mark "Blocked" if stuck

3. **Communicate Variance**
   - If going over estimate, add a comment
   - Explain what's taking longer
   - Request estimate adjustment if needed

4. **Celebrate Completion**
   - Mark tasks done promptly
   - Add completion notes
   - Share learnings with team

---

## Common Scenarios

### Scenario 1: Working on Multiple Days

**Day 1:**
- Start: 9:00 AM
- Pause (End of day): 5:00 PM
- Time logged: 8 hours

**Day 2:**
- Start: 9:00 AM
- Complete: 11:00 AM
- Time logged: 2 hours

**Total Actual Hours: 10 hours**

### Scenario 2: Interrupted Work

**Morning:**
- Start: 9:00 AM
- Pause (Meeting): 10:00 AM → 1 hour logged

**After Meeting:**
- Start: 11:00 AM
- Pause (Lunch): 12:00 PM → 1 hour logged

**Afternoon:**
- Start: 1:00 PM
- Complete: 3:00 PM → 2 hours logged

**Total Actual Hours: 4 hours**

### Scenario 3: Task Goes Over Estimate

**Estimated: 4 hours**

**Reality:**
- Day 1: 3 hours worked
- Day 2: 2 hours worked
- Total: 5 hours (125% of estimate)

**What to do:**
1. Add comment explaining why it took longer
2. Complete the task
3. Use this data for future estimates
4. Discuss with team if pattern emerges

### Scenario 4: Blocked Task

**Situation:** Waiting for API documentation

**Steps:**
1. Pause work with reason "Blocked"
2. Change task status to "Blocked"
3. Add comment with type "Blocker":
   - "Waiting for API documentation from backend team"
   - Tag relevant team members
4. Work on other tasks
5. Resume when blocker is resolved

---

## Keyboard Shortcuts

Currently, the system uses mouse/touch interactions. Future versions may include:
- `S` - Start working
- `P` - Pause work
- `C` - Complete task
- `N` - New comment
- `E` - Edit task

---

## Mobile Usage

The system is fully responsive and works on mobile devices:

- **Task List**: Swipe to see all columns
- **Task Detail**: Tabs are touch-friendly
- **Time Tracking**: Large buttons for easy tapping
- **Comments**: Full keyboard support
- **History**: Scrollable timeline

---

## Troubleshooting

### "You are not assigned to this task"
**Solution:** Ask project admin to assign the task to you.

### "You are already working on another task"
**Solution:** Pause or complete your current task first.

### "Cannot start task in Done status"
**Solution:** Change task status back to "In Progress" if you need to work on it again.

### Timer not updating
**Solution:** Refresh the page. Time is tracked on the server, so no time will be lost.

### Actual hours seem wrong
**Solution:** Check the Time Logs tab to see all work sessions. Contact admin if there's an error.

---

## Getting Help

If you encounter issues or have questions:

1. **Check this guide** - Most common questions are answered here
2. **Review task history** - See what actions have been taken
3. **Ask your team** - Use comments to ask questions
4. **Contact admin** - For technical issues or permissions

---

## Feature Roadmap

Coming soon:
- 📧 Email notifications
- 📱 Mobile app
- 📊 Advanced analytics
- 🔔 Real-time notifications
- 📎 File attachments
- 🔗 Task dependencies

---

**Last Updated:** 2026-05-26  
**Version:** 1.0  
**For:** Ramiscope Project Management System
