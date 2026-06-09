/**
 * Task Time Logs Component
 * Displays time tracking history for a task
 */

import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { TaskTimeTrackingService } from '../../../core/services/task-time-tracking.service';
import { TimeLog, ActiveWorker } from '../../../core/models/task-time-log.model';

interface UserTimeSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalMinutes: number;
  totalHours: number;
  logCount: number;
  isActive: boolean;
}

@Component({
  selector: 'app-task-time-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './task-time-logs.component.html',
  styleUrls: ['./task-time-logs.component.scss']
})
export class TaskTimeLogsComponent implements OnInit {
  private timeTrackingService = inject(TaskTimeTrackingService);
  private cdr = inject(ChangeDetectorRef);

  @Input() projectId!: string;
  @Input() taskId!: string;

  timeLogs: TimeLog[] = [];
  activeWorkers: ActiveWorker[] = [];
  userSummaries: UserTimeSummary[] = [];
  isLoading: boolean = true;

  displayedColumns: string[] = ['user', 'startTime', 'endTime', 'duration', 'status'];

  ngOnInit(): void {
    this.loadTimeLogs();
    this.loadActiveWorkers();
  }

  /**
   * Load time logs
   */
  loadTimeLogs(): void {
    this.isLoading = true;
    this.timeTrackingService.getTimeLogs(this.projectId, this.taskId).subscribe({
      next: (logs) => {
        this.timeLogs = logs;
        this.calculateUserSummaries();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading time logs:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load active workers
   */
  loadActiveWorkers(): void {
    this.timeTrackingService.getActiveWorkers(this.projectId, this.taskId).subscribe({
      next: (workers) => {
        this.activeWorkers = workers;
        this.calculateUserSummaries();
      },
      error: (error) => {
        console.error('Error loading active workers:', error);
      }
    });
  }

  /**
   * Calculate summary by user
   */
  calculateUserSummaries(): void {
    const userMap = new Map<string, UserTimeSummary>();

    // Process time logs
    this.timeLogs.forEach(log => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          userId: log.userId,
          userName: `${log.user.firstName} ${log.user.lastName}`.trim() || log.user.username,
          userEmail: log.user.email,
          totalMinutes: 0,
          totalHours: 0,
          logCount: 0,
          isActive: false
        });
      }

      const summary = userMap.get(log.userId)!;
      summary.logCount++;
      
      if (log.durationMinutes) {
        summary.totalMinutes += log.durationMinutes;
      }
    });

    // Mark active users
    this.activeWorkers.forEach(worker => {
      if (userMap.has(worker.user.id)) {
        userMap.get(worker.user.id)!.isActive = true;
      }
    });

    // Calculate hours and sort
    this.userSummaries = Array.from(userMap.values())
      .map(summary => ({
        ...summary,
        totalHours: parseFloat((summary.totalMinutes / 60).toFixed(2))
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  /**
   * Format date time
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format duration
   */
  formatDuration(minutes: number | null): string {
    if (minutes === null) return '-';
    return this.timeTrackingService.formatDuration(minutes);
  }

  /**
   * Get user display name
   */
  getUserName(log: TimeLog): string {
    return `${log.user.firstName} ${log.user.lastName}`.trim() || log.user.username;
  }

  /**
   * Check if log is active
   */
  isActiveLog(log: TimeLog): boolean {
    return log.isActive;
  }
}
