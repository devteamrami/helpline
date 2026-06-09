/**
 * Task Comments Service
 * Handles task comments and activity updates
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TaskComment,
  AddCommentRequest,
  UpdateCommentRequest,
  CommentsResponse,
  CommentType
} from '../models/task-comment.model';

@Injectable({
  providedIn: 'root'
})
export class TaskCommentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  // State management
  private commentsSubject = new BehaviorSubject<TaskComment[]>([]);
  public comments$ = this.commentsSubject.asObservable();

  private paginationSubject = new BehaviorSubject<{
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  /**
   * Get comments for a task
   */
  getComments(
    projectId: string,
    taskId: string,
    page: number = 1,
    limit: number = 20,
    commentType?: CommentType
  ): Observable<CommentsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (commentType) {
      params = params.set('commentType', commentType);
    }

    return this.http
      .get<{ success: boolean; data: CommentsResponse; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/comments`,
        { params }
      )
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.commentsSubject.next(response.data.comments);
            this.paginationSubject.next(response.data.pagination);
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Add comment to task
   */
  addComment(
    projectId: string,
    taskId: string,
    comment: string,
    commentType: CommentType = 'general'
  ): Observable<{ comment: TaskComment }> {
    const body: AddCommentRequest = { comment, commentType };

    return this.http
      .post<{ success: boolean; data: { comment: TaskComment }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/comments`,
        body
      )
      .pipe(
        tap(response => {
          if (response.success && response.data.comment) {
            // Add new comment to the beginning of the list
            const currentComments = this.commentsSubject.value;
            this.commentsSubject.next([response.data.comment, ...currentComments]);
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Update comment
   */
  updateComment(
    projectId: string,
    taskId: string,
    commentId: string,
    comment: string
  ): Observable<{ comment: TaskComment }> {
    const body: UpdateCommentRequest = { comment };

    return this.http
      .put<{ success: boolean; data: { comment: TaskComment }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/comments/${commentId}`,
        body
      )
      .pipe(
        tap(response => {
          if (response.success && response.data.comment) {
            // Update comment in the list
            const currentComments = this.commentsSubject.value;
            const index = currentComments.findIndex(c => c.id === commentId);
            if (index !== -1) {
              currentComments[index] = response.data.comment;
              this.commentsSubject.next([...currentComments]);
            }
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Delete comment
   */
  deleteComment(
    projectId: string,
    taskId: string,
    commentId: string
  ): Observable<void> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/comments/${commentId}`
      )
      .pipe(
        tap(response => {
          if (response.success) {
            // Remove comment from the list
            const currentComments = this.commentsSubject.value;
            this.commentsSubject.next(currentComments.filter(c => c.id !== commentId));
          }
        }),
        map(() => undefined)
      );
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.commentsSubject.next([]);
    this.paginationSubject.next(null);
  }

  /**
   * Get current comments
   */
  getCommentsValue(): TaskComment[] {
    return this.commentsSubject.value;
  }
}
