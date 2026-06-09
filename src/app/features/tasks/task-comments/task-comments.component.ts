/**
 * Task Comments Component
 * Displays and manages task comments and activity updates
 */

import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TaskCommentsService } from '../../../core/services/task-comments.service';
import { TaskComment, CommentType, COMMENT_TYPES } from '../../../core/models/task-comment.model';

@Component({
  selector: 'app-task-comments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './task-comments.component.html',
  styleUrls: ['./task-comments.component.scss']
})
export class TaskCommentsComponent implements OnInit {
  private commentsService = inject(TaskCommentsService);
  private cdr = inject(ChangeDetectorRef);

  @Input() projectId!: string;
  @Input() taskId!: string;
  @Input() currentUserId!: string;

  comments: TaskComment[] = [];
  commentTypes = COMMENT_TYPES;
  isLoading: boolean = true;
  isSubmitting: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;

  // Form controls
  commentControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(5000)
  ]);
  commentTypeControl = new FormControl<CommentType>('general');

  // Edit mode
  editingCommentId: string | null = null;
  editCommentControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(5000)
  ]);

  ngOnInit(): void {
    this.loadComments();
  }

  /**
   * Load comments
   */
  loadComments(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;

    this.commentsService.getComments(
      this.projectId,
      this.taskId,
      page,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.comments = response.comments;
        this.totalItems = response.pagination.totalItems;
        this.totalPages = response.pagination.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Add comment
   */
  async onAddComment(): Promise<void> {
    if (this.commentControl.invalid || this.isSubmitting) return;

    const comment = this.commentControl.value?.trim();
    const commentType = this.commentTypeControl.value || 'general';

    if (!comment) return;

    this.isSubmitting = true;
    try {
      await this.commentsService.addComment(
        this.projectId,
        this.taskId,
        comment,
        commentType
      ).toPromise();

      // Clear form
      this.commentControl.reset();
      this.commentTypeControl.setValue('general');

      // Reload comments
      this.loadComments(1);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Start editing comment
   */
  startEdit(comment: TaskComment): void {
    this.editingCommentId = comment.id;
    this.editCommentControl.setValue(comment.comment);
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingCommentId = null;
    this.editCommentControl.reset();
  }

  /**
   * Save edited comment
   */
  async saveEdit(commentId: string): Promise<void> {
    if (this.editCommentControl.invalid) return;

    const updatedComment = this.editCommentControl.value?.trim();
    if (!updatedComment) return;

    try {
      await this.commentsService.updateComment(
        this.projectId,
        this.taskId,
        commentId,
        updatedComment
      ).toPromise();

      this.editingCommentId = null;
      this.editCommentControl.reset();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  }

  /**
   * Delete comment
   */
  async onDeleteComment(commentId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await this.commentsService.deleteComment(
        this.projectId,
        this.taskId,
        commentId
      ).toPromise();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadComments(event.pageIndex + 1);
  }

  /**
   * Check if user can edit/delete comment
   */
  canModifyComment(comment: TaskComment): boolean {
    return comment.userId === this.currentUserId;
  }

  /**
   * Get comment type info
   */
  getCommentTypeInfo(type: CommentType) {
    return this.commentTypes.find(t => t.value === type) || this.commentTypes[0];
  }

  /**
   * Get user display name
   */
  getUserName(comment: TaskComment): string {
    return `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.username;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Check if comment was edited
   */
  wasEdited(comment: TaskComment): boolean {
    return comment.createdAt !== comment.updatedAt;
  }
}
