/**
 * Project Member Service
 * Handles project member management operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  ProjectMember,
  AvailableUser,
  AddProjectMemberRequest,
  UpdateProjectMemberRoleRequest
} from '../models/project.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectMemberService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  // State management
  private membersSubject = new BehaviorSubject<ProjectMember[]>([]);
  public members$ = this.membersSubject.asObservable();

  /**
   * Get current members value
   */
  get membersValue(): ProjectMember[] {
    return this.membersSubject.value;
  }

  /**
   * Get project members
   */
  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.http.get<ApiResponse<{ members: ProjectMember[] }>>(
      `${this.apiUrl}/${projectId}/members`
    ).pipe(
      map(response => response.data.members),
      tap(members => this.membersSubject.next(members))
    );
  }

  /**
   * Get available users for project
   */
  getAvailableUsers(projectId: string): Observable<AvailableUser[]> {
    return this.http.get<ApiResponse<{ users: AvailableUser[] }>>(
      `${this.apiUrl}/${projectId}/available-users`
    ).pipe(
      map(response => response.data.users)
    );
  }

  /**
   * Add member to project
   */
  addProjectMember(projectId: string, request: AddProjectMemberRequest): Observable<ProjectMember> {
    return this.http.post<ApiResponse<{ member: ProjectMember }>>(
      `${this.apiUrl}/${projectId}/members`,
      request
    ).pipe(
      map(response => response.data.member),
      tap(member => {
        const currentMembers = this.membersValue;
        this.membersSubject.next([...currentMembers, member]);
      })
    );
  }

  /**
   * Update project member role
   */
  updateProjectMemberRole(
    projectId: string,
    memberId: string,
    request: UpdateProjectMemberRoleRequest
  ): Observable<ProjectMember> {
    return this.http.put<ApiResponse<{ member: ProjectMember }>>(
      `${this.apiUrl}/${projectId}/members/${memberId}`,
      request
    ).pipe(
      map(response => response.data.member),
      tap(updatedMember => {
        const currentMembers = this.membersValue;
        const index = currentMembers.findIndex(m => m.id === memberId);
        if (index !== -1) {
          currentMembers[index] = { ...currentMembers[index], ...updatedMember };
          this.membersSubject.next([...currentMembers]);
        }
      })
    );
  }

  /**
   * Remove member from project
   */
  removeProjectMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/${projectId}/members/${memberId}`
    ).pipe(
      map(() => void 0),
      tap(() => {
        const currentMembers = this.membersValue;
        const filteredMembers = currentMembers.filter(m => m.id !== memberId);
        this.membersSubject.next(filteredMembers);
      })
    );
  }

  /**
   * Clear members state
   */
  clearMembers(): void {
    this.membersSubject.next([]);
  }
}
