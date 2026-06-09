/**
 * Task Detail Component
 * Displays complete task information with time tracking, comments, and history
 */

import { Component, OnInit, OnDestroy, Input, inject, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { TimeTrackingWidgetComponent } from '../time-tracking-widget/time-tracking-widget.component';
import { TaskTimeLogsComponent } from '../task-time-logs/task-time-logs.component';
import { TaskCommentsComponent } from '../task-comments/task-comments.component';
import { TaskHistoryComponent } from '../task-history/task-history.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TimeTrackingWidgetComponent,
    TaskTimeLogsComponent,
    TaskCommentsComponent,
    TaskHistoryComponent
  ],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private destroy$ = new Subject<void>();

  @Input() projectId!: string;
  @Input() taskId!: string;
  @Input() isInDialog = false;
  
  task: Task | null = null;
  currentUserId: string = '';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    console.log('🚀 Component initialized', { isInDialog: this.isInDialog });
    // Get current user
    const currentUser = this.authService.currentUserValue;
    this.currentUserId = currentUser?.id || '';

    // If not in dialog mode, get route parameters
    if (!this.isInDialog) {
      this.route.params
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          console.log('📍 Route params:', params);
          this.projectId = params['projectId'];
          this.taskId = params['taskId'];
          this.loadTask();
        });
    } else {
      // In dialog mode, projectId and taskId are passed as inputs
      this.loadTask();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load task details
   */
  loadTask(): void {
    console.log('🔄 Loading task...', { projectId: this.projectId, taskId: this.taskId });
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Force update before API call

    this.taskService.getTaskById(this.projectId, this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          console.log('✅ Task loaded successfully:', task);
          this.task = task;
          this.isLoading = false;
          
          // Try multiple change detection strategies
          this.cdr.detectChanges();
          this.appRef.tick();
          setTimeout(() => {
            this.cdr.detectChanges();
            console.log('🔄 Change detection forced, isLoading:', this.isLoading);
          }, 0);
        },
        error: (error) => {
          console.error('❌ Error loading task:', error);
          this.errorMessage = error.message || 'Failed to load task';
          this.isLoading = false;
          this.cdr.detectChanges();
          this.appRef.tick();
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
  }

  /**
   * Handle task updated (from time tracking widget)
   */
  onTaskUpdated(): void {
    this.loadTask();
  }

  /**
   * Check if current user is assigned to task
   */
  isAssignedToCurrentUser(): boolean {
    // Check in assignees array first
    if (this.task?.assignees && this.task.assignees.length > 0) {
      return this.task.assignees.some(a => a.id === this.currentUserId);
    }
    // Fallback to single assignee
    return this.task?.assigneeId === this.currentUserId;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    if (!this.task || !this.task.estimatedHours || this.task.estimatedHours === 0) {
      return 0;
    }
    const percentage = (this.task.actualHours / this.task.estimatedHours) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  /**
   * Get progress class
   */
  getProgressClass(): string {
    const percentage = this.getProgressPercentage();
    if (percentage >= 100) return 'progress-complete';
    if (percentage >= 75) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    return 'progress-low';
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: TaskStatus): string {
    const statusClasses: Record<TaskStatus, string> = {
      'To Do': 'status-todo',
      'In Progress': 'status-in-progress',
      'In Review': 'status-in-review',
      'Done': 'status-done',
      'Blocked': 'status-blocked'
    };
    return statusClasses[status] || '';
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: TaskPriority): string {
    const priorityClasses: Record<TaskPriority, string> = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high',
      'Critical': 'priority-critical'
    };
    return priorityClasses[priority] || '';
  }

  /**
   * Get assignee display name (for backward compatibility)
   */
  getAssigneeName(): string {
    if (!this.task?.assignee) return 'Unassigned';
    const { firstName, lastName, username } = this.task.assignee;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return username;
  }

  /**
   * Get assignee display name from assignee object
   */
  getAssigneeDisplayName(assignee: { firstName?: string; lastName?: string; username: string }): string {
    if (assignee.firstName && assignee.lastName) {
      return `${assignee.firstName} ${assignee.lastName}`;
    }
    return assignee.username;
  }

  /**
   * Get assignee initials
   */
  getAssigneeInitials(assignee: { firstName?: string; lastName?: string; username: string }): string {
    if (assignee.firstName && assignee.lastName) {
      return `${assignee.firstName[0]}${assignee.lastName[0]}`.toUpperCase();
    }
    return assignee.username.substring(0, 2).toUpperCase();
  }

  /**
   * Format date
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format datetime
   */
  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Go back to project
   */
  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
