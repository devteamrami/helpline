/**
 * Department Service
 * Handles department management API calls
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '../models/department.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/departments`;

  /**
   * Get all departments
   */
  getDepartments(filters?: { isActive?: boolean; search?: string }): Observable<Department[]> {
    let params = new HttpParams();

    if (filters?.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http
      .get<ApiResponse<{ departments: Department[] }>>(this.apiUrl, { params })
      .pipe(
        map((response) => response.data!.departments),
        catchError((error) => {
          const errorMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Get department by ID
   */
  getDepartmentById(id: string): Observable<Department> {
    return this.http
      .get<ApiResponse<{ department: Department }>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data!.department),
        catchError((error) => {
          const errorMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Create new department
   */
  createDepartment(data: CreateDepartmentRequest): Observable<Department> {
    return this.http
      .post<ApiResponse<{ department: Department }>>(this.apiUrl, data)
      .pipe(
        map((response) => response.data!.department),
        catchError((error) => {
          const errorMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Update department
   */
  updateDepartment(id: string, data: UpdateDepartmentRequest): Observable<Department> {
    return this.http
      .put<ApiResponse<{ department: Department }>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data!.department),
        catchError((error) => {
          const errorMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Delete department
   */
  deleteDepartment(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => undefined),
        catchError((error) => {
          const errorMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Extract error message from HTTP error response
   */
  private extractErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.map((e: any) => e.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
