/**
 * Time Tracking Widget Component
 * Displays Start/Pause/Complete buttons for task time tracking
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TaskTimeTrackingService } from '../../../core/services/task-time-tracking.service';
import { TimeLog } from '../../../core/models/task-time-log.model';

@Component({
  selector: 'app-time-tracking-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './time-tracking-widget.component.html',
  styleUrls: ['./time-tracking-widget.component.scss']
})
export class TimeTrackingWidgetComponent implements OnInit, OnChanges, OnDestroy {
  private timeTrackingService = inject(TaskTimeTrackingService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  @Input() projectId!: string;
  @Input() taskId!: string;
  @Input() taskStatus!: string;
  @Input() currentUserId!: string;
  @Input() isAssignedToCurrentUser: boolean = false;

  @Output() taskStarted = new EventEmitter<void>();
  @Output() taskPaused = new EventEmitter<void>();
  @Output() taskCompleted = new EventEmitter<void>();

  activeTimeLog: TimeLog | null = null;
  elapsedTime: string = '0m';
  isLoading: boolean = false;

  // Internal status tracks the real-time status immediately after actions,
  // without waiting for the parent to re-pass the @Input
  private _internalStatus: string | null = null;

  /** Effective status: internal override takes priority over @Input */
  get effectiveStatus(): string {
    return this._internalStatus ?? this.taskStatus;
  }

  private timerSubscription?: Subscription;
  private stateSubscription?: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    // When parent passes a fresh taskStatus, clear our internal override
    if (changes['taskStatus'] && !changes['taskStatus'].firstChange) {
      this._internalStatus = null;
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    // activeTimeLog$ is a global singleton and must NOT be used for per-user button logic.
    this.stateSubscription = this.timeTrackingService.activeWorkers$.subscribe(
      workers => {
        // Find if the CURRENT USER is actively working on THIS SPECIFIC TASK
        const myActiveWork = workers.find(
          w => w.user.id === this.currentUserId
        );

        if (myActiveWork) {
          // Current user IS working on this task — build a local TimeLog for timer
          this.activeTimeLog = {
            id: myActiveWork.timeLogId,
            taskId: this.taskId,
            userId: this.currentUserId,
            startTime: myActiveWork.startTime,
            isActive: true,
            createdAt: myActiveWork.startTime
          } as TimeLog;
          this.startTimer(myActiveWork.startTime);
        } else {
          // Current user is NOT working on this task — clear local state
          this.activeTimeLog = null;
          this.stopTimer();
        }

        this.cdr.detectChanges();
      }
    );

    // Load initial state from server
    this.loadActiveWorkers();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Check if user can start task.
   * True when:
   *  - User is assigned to this task
   *  - Task is not Done
   *  - Current user is NOT already working on THIS task
   *  - Not currently loading
   */
  canStartTask(): boolean {
    const isWorkingOnThisTask = this.activeTimeLog !== null &&
                                 this.activeTimeLog.isActive === true;
    return (
      this.isAssignedToCurrentUser &&
      this.effectiveStatus !== 'Done' &&
      !isWorkingOnThisTask &&
      !this.isLoading
    );
  }

  /**
   * Check if user can pause task.
   * True only when the current user is actively working on THIS task
   * AND the task is not Done.
   */
  canPauseTask(): boolean {
    return (
      this.activeTimeLog !== null &&
      this.activeTimeLog.isActive === true &&
      this.effectiveStatus !== 'Done' &&
      !this.isLoading
    );
  }

  /**
   * Check if user can complete task.
   * True when assigned, task not done, and task has been started at least once.
   */
  canCompleteTask(): boolean {
    const hasBeenStarted = this.activeTimeLog !== null || this.effectiveStatus === 'In Progress';
    return (
      this.isAssignedToCurrentUser &&
      this.effectiveStatus !== 'Done' &&
      hasBeenStarted &&
      !this.isLoading
    );
  }

  /**
   * Start working on task
   */
  async onStartTask(): Promise<void> {
    if (!this.canStartTask()) return;

    this.isLoading = true;
    this.cdr.detectChanges(); // Update UI immediately
    
    try {
      await this.timeTrackingService.startTask(this.projectId, this.taskId).toPromise();
      this.taskStarted.emit();
      
      // Reload active workers to update button states
      this.loadActiveWorkers();
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Task Started',
        text: 'Time tracking has begun for this task.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error starting task:', error);
      
      // Check if error is about having an active task
      const errorMessage = error?.error?.message || error?.message || '';
      
      if (errorMessage.includes('already have an active time log') || 
          errorMessage.includes('Please pause it before starting')) {

        // Extract the active task title from the error response if available
        const activeTasks: any[] = error?.error?.activeTasks || [];
        const activeTaskNames = activeTasks.map((t: any) => `"${t.title}"`).join(', ');
        const activeTaskInfo = activeTaskNames
          ? `<p style="margin-bottom: 12px; color: #374151; font-size: 13px;">Currently running: <strong>${activeTaskNames}</strong></p>`
          : '';

        // Show SweetAlert2 confirmation dialog with option to continue
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Another Task Is Running',
          html: `
            <div style="text-align: left; padding: 0 8px;">
              <p style="margin-bottom: 12px; font-weight: 500; color: #111827;">
                You already have another task actively running.
              </p>
              ${activeTaskInfo}
              <p style="margin-bottom: 12px; color: #6b7280; font-size: 13px;">
                Working on multiple tasks simultaneously may affect time tracking accuracy.
              </p>
              <p style="margin-bottom: 12px; color: #6b7280; font-size: 13px;">
                <strong>Tip:</strong> Pause the running task first for accurate time tracking.
              </p>
              <p style="font-weight: 500; color: #111827;">Do you want to start this task anyway?</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Yes, Start Anyway',
          cancelButtonText: 'No, Cancel',
          confirmButtonColor: '#f59e0b',
          cancelButtonColor: '#6c757d',
          reverseButtons: true,
          customClass: {
            popup: 'swal-wide'
          }
        });

        if (result.isConfirmed) {
          // User wants to start anyway - force start the task
          try {
            await this.timeTrackingService.startTask(this.projectId, this.taskId, true).toPromise();
            this.taskStarted.emit();
            
            // Reload active workers to update button states
            this.loadActiveWorkers();
            
            Swal.fire({
              icon: 'info',
              title: 'Task Started',
              text: 'You now have multiple active tasks. Remember to track your time accurately.',
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
            
            this.isLoading = false;
            this.cdr.detectChanges();
          } catch (forceError: any) {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Start Task',
              text: forceError?.error?.message || 'An error occurred while starting the task.',
              confirmButtonColor: '#3d99fc'
            });
            
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        } else {
          // User cancelled - reset loading state
          console.log('User cancelled starting task');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      } else {
        // Other error - show generic error message
        Swal.fire({
          icon: 'error',
          title: 'Failed to Start Task',
          text: errorMessage || 'An error occurred while starting the task. Please try again.',
          confirmButtonColor: '#3d99fc'
        });
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Pause working on task
   */
  async onPauseTask(): Promise<void> {
    if (!this.canPauseTask()) return;

    // Open dialog to get pause reason
    const dialogRef = this.dialog.open(PauseReasonDialogComponent, {
      width: '400px',
      disableClose: false
    });

    const pauseReason = await dialogRef.afterClosed().toPromise();
    
    if (pauseReason === undefined) {
      return; // User cancelled
    }

    this.isLoading = true;
    try {
      await this.timeTrackingService.pauseTask(
        this.projectId,
        this.taskId,
        pauseReason || undefined
      ).toPromise();
      this.taskPaused.emit();
      
      // Reload active workers to update button states
      this.loadActiveWorkers();
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Task Paused',
        text: 'Time tracking has been paused.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error: any) {
      console.error('Error pausing task:', error);
      const errorMessage = error?.error?.message || error?.message || 'An error occurred while pausing the task.';
      
      Swal.fire({
        icon: 'error',
        title: 'Failed to Pause Task',
        text: errorMessage,
        confirmButtonColor: '#3d99fc'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Complete task
   */
  async onCompleteTask(): Promise<void> {
    if (!this.canCompleteTask()) return;

    // Open dialog to get completion notes
    const dialogRef = this.dialog.open(CompletionNotesDialogComponent, {
      width: '500px',
      disableClose: false
    });

    const completionNotes = await dialogRef.afterClosed().toPromise();
    
    if (completionNotes === undefined) {
      return; // User cancelled
    }

    this.isLoading = true;
    try {
      await this.timeTrackingService.completeTask(
        this.projectId,
        this.taskId,
        completionNotes || undefined
      ).toPromise();

      // Immediately update internal state so buttons disable right away
      this._internalStatus = 'Done';
      this.activeTimeLog = null;
      this.stopTimer();
      this.cdr.detectChanges();

      this.taskCompleted.emit();
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Task Completed',
        text: 'Task has been marked as complete!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      const errorMessage = error?.error?.message || error?.message || 'An error occurred while completing the task.';
      
      Swal.fire({
        icon: 'error',
        title: 'Failed to Complete Task',
        text: errorMessage,
        confirmButtonColor: '#3d99fc'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Start elapsed time timer
   */
  private startTimer(startTime: string): void {
    this.stopTimer();
    
    // Update immediately
    this.updateElapsedTime(startTime);
    
    // Update every minute
    this.timerSubscription = interval(60000).subscribe(() => {
      this.updateElapsedTime(startTime);
    });
  }

  /**
   * Stop elapsed time timer
   */
  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.elapsedTime = '0m';
  }

  /**
   * Update elapsed time display
   */
  private updateElapsedTime(startTime: string): void {
    const minutes = this.timeTrackingService.calculateElapsedMinutes(startTime);
    this.elapsedTime = this.timeTrackingService.formatDuration(minutes);
  }

  /**
   * Load active workers
   */
  private loadActiveWorkers(): void {
    this.timeTrackingService.getActiveWorkers(this.projectId, this.taskId).subscribe({
      error: (error) => console.error('Error loading active workers:', error)
    });
  }
}

/**
 * Pause Reason Dialog Component
 */
@Component({
  selector: 'app-pause-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Pause Task</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reason for pausing (optional)</mat-label>
        <textarea
          matInput
          [formControl]="reasonControl"
          rows="3"
          placeholder="e.g., Taking a break, switching to another task..."
          maxlength="500"
        ></textarea>
        <mat-hint align="end">{{ reasonControl.value?.length || 0 }}/500</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="reasonControl.value">
        Pause Task
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class PauseReasonDialogComponent {
  reasonControl = new FormControl('', [Validators.maxLength(500)]);
}

/**
 * Completion Notes Dialog Component
 */
@Component({
  selector: 'app-completion-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Complete Task</h2>
    <mat-dialog-content>
      <p>Are you sure you want to mark this task as complete?</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Completion notes (optional)</mat-label>
        <textarea
          matInput
          [formControl]="notesControl"
          rows="4"
          placeholder="e.g., Implemented feature X, tested on Y..."
          maxlength="1000"
        ></textarea>
        <mat-hint align="end">{{ notesControl.value?.length || 0 }}/1000</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="notesControl.value">
        Complete Task
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    p {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class CompletionNotesDialogComponent {
  notesControl = new FormControl('', [Validators.maxLength(1000)]);
}
