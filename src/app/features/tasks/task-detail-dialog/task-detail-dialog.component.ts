/**
 * Task Detail Dialog Component
 * Wrapper component that displays TaskDetailComponent in a dialog
 */

import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaskDetailComponent } from '../task-detail/task-detail.component';

export interface TaskDetailDialogData {
  projectId: string;
  taskId: string;
}

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TaskDetailComponent
  ],
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.scss']
})
export class TaskDetailDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TaskDetailDialogComponent>);
  
  projectId: string;
  taskId: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: TaskDetailDialogData) {
    this.projectId = data.projectId;
    this.taskId = data.taskId;
  }

  ngOnInit(): void {
    console.log('📋 Task Detail Dialog opened:', { projectId: this.projectId, taskId: this.taskId });
  }

  /**
   * Close dialog
   */
  close(): void {
    this.dialogRef.close();
  }
}
