/**
 * FAQ Service
 * Manages FAQ-related API calls and reactive state via BehaviorSubject
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Faq,
  CreateFaqRequest,
  UpdateFaqRequest,
  FaqListParams,
  FaqListResponse
} from '../models/ticket.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/faqs`;

  /**
   * Get FAQs with optional pagination params.
   * Updates faqsSubject on success.
   */
  getFaqs(params?: FaqListParams): Observable<FaqListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<ApiResponse<FaqListResponse>>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => response.data!),
        catchError(error => throwError(() => new Error(this.extractErrorMessage(error))))
      );
  }

  createFaq(data: CreateFaqRequest): Observable<Faq> {
    return this.http
      .post<ApiResponse<Faq>>(this.apiUrl, data)
      .pipe(
        map(response => response.data!),
        catchError(error => throwError(() => new Error(this.extractErrorMessage(error))))
      );
  }

  updateFaq(id: string, data: UpdateFaqRequest): Observable<Faq> {
    return this.http
      .put<ApiResponse<Faq>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map(response => response.data!),
        catchError(error => throwError(() => new Error(this.extractErrorMessage(error))))
      );
  }

  /**
   * Delete an FAQ entry by ID.
   * Refreshes the FAQ list after success.
   */
  deleteFaq(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => void 0),
        catchError(error => throwError(() => new Error(this.extractErrorMessage(error))))
      );
  }

  /**
   * Extract a human-readable error message from an HTTP error response.
   */
  private extractErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors && error.error.errors.length > 0) {
      return error.error.errors.map((e: any) => e.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
