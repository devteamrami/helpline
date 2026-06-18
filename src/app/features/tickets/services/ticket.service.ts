/**
 * Ticket Service
 * Manages ticket-related API calls and reactive state for the PMS staff interface.
 *
 * Requirements: 6.3, 6.4, 6.5, 6.9, 6.11
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  Ticket,
  TicketDetail,
  TicketStatus,
  TicketListParams,
  TicketListResponse,
  ConversationEntry,
  Attachment,
} from '../models/ticket.model';

// ─── Internal API response wrapper ───────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// ─── Raw snake_case shapes returned by the backend ───────────────────────────

interface RawAttachment {
  s3Key: string;
  originalName: string;
}

interface RawTicket {
  id: string;
  ticket_name: string;
  description: string;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  employee_code: string;
  site_id: string;
  site_name: string;
  page_url: string;
  status: TicketStatus;
  last_reply_by: 'user' | 'staff' | null;
  last_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawConversationEntry {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'staff';
  sender_id: string;
  sender_first_name?: string;
  sender_last_name?: string;
  message: string;
  attachments: RawAttachment[];
  created_at: string;
}

interface RawTicketDetail extends RawTicket {
  conversations: RawConversationEntry[];
}

interface RawTicketListResponse {
  tickets: RawTicket[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapTicket(raw: RawTicket): Ticket {
  return {
    id: raw.id,
    ticketName: raw.ticket_name,
    description: raw.description,
    userId: raw.user_id,
    userFirstName: raw.user_first_name,
    userLastName: raw.user_last_name,
    userEmail: raw.user_email,
    employeeCode: raw.employee_code,
    siteId: raw.site_id,
    siteName: raw.site_name,
    pageUrl: raw.page_url,
    status: raw.status,
    lastReplyBy: raw.last_reply_by,
    lastRepliedAt: raw.last_replied_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapConversationEntry(raw: RawConversationEntry): ConversationEntry {
  return {
    id: raw.id,
    ticketId: raw.ticket_id,
    senderType: raw.sender_type,
    senderId: raw.sender_id,
    senderFirstName: raw.sender_first_name,
    senderLastName: raw.sender_last_name,
    message: raw.message,
    attachments: (raw.attachments ?? []).map(
      (a): Attachment => ({ s3Key: a.s3Key, originalName: a.originalName })
    ),
    createdAt: raw.created_at,
  };
}

function mapTicketDetail(raw: RawTicketDetail): TicketDetail {
  return {
    ...mapTicket(raw),
    conversations: (raw.conversations ?? []).map(mapConversationEntry),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);

  // ── Reactive state ──────────────────────────────────────────────────────────

  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  // ── Accessors ───────────────────────────────────────────────────────────────

  get ticketsValue(): Ticket[] {
    return this.ticketsSubject.value;
  }

  // ── Methods ─────────────────────────────────────────────────────────────────

  /**
   * Fetch a paginated, filterable list of tickets.
   * Sets loading state before the request and updates ticketsSubject on success.
   *
   * Requirements: 6.3, 6.4, 6.5
   */
  getTickets(params?: TicketListParams): Observable<TicketListResponse> {
    // Loading state is managed by the component to avoid stuck-spinner bugs
    // when multiple calls are made in quick succession (e.g. on init).
    this.errorSubject.next(null);

    const httpParams = this.buildParams(params);

    return this.http
      .get<ApiResponse<RawTicketListResponse>>(this.apiUrl, { params: httpParams })
      .pipe(
        map((response) => {
          const raw = response.data!;
          return {
            tickets: raw.tickets.map(mapTicket),
            pagination: raw.pagination,
          } satisfies TicketListResponse;
        }),
        tap((data) => {
          this.ticketsSubject.next(data.tickets);
        }),
        catchError((error) => {
          const message = this.extractErrorMessage(error);
          this.errorSubject.next(message);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Fetch a single ticket by ID, including its full conversation thread.
   *
   * Requirements: 6.6, 6.7
   */
  getTicketById(id: string): Observable<TicketDetail> {
    return this.http
      .get<ApiResponse<RawTicketDetail>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          console.log('[TicketService] getTicketById response:', response);
          return mapTicketDetail(response.data!);
        }),
        catchError((error) => {
          console.error('[TicketService] getTicketById error:', error);
          const message = this.extractErrorMessage(error);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Get distinct site names for filter dropdown.
   */
  getSites(): Observable<string[]> {
    return this.http
      .get<ApiResponse<{ sites: string[] }>>(`${this.apiUrl}/sites`)
      .pipe(
        map((response) => response.data?.sites ?? []),
        catchError(() => throwError(() => new Error('Failed to load sites')))
      );
  }

  /**
   * Submit a conversation reply (with optional file attachments via FormData).
   * On success, the caller is responsible for appending the returned entry to
   * the local conversation thread.
   *
   * Requirements: 6.9
   */
  addConversation(ticketId: string, formData: FormData): Observable<ConversationEntry> {
    return this.http
      .post<ApiResponse<RawConversationEntry>>(
        `${this.apiUrl}/${ticketId}/conversations`,
        formData
      )
      .pipe(
        map((response) => mapConversationEntry(response.data!)),
        catchError((error) => {
          const message = this.extractErrorMessage(error);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Update the status of a ticket.
   * On failure the caller should revert the UI to the previous status.
   *
   * Requirements: 6.11
   */
  updateTicketStatus(ticketId: string, status: TicketStatus): Observable<Ticket> {
    return this.http
      .patch<ApiResponse<{ id: string; status: TicketStatus }>>(
        `${this.apiUrl}/${ticketId}/status`,
        { status }
      )
      .pipe(
        map((response) => {
          // The PATCH endpoint returns only { id, status }; merge into the
          // cached ticket so callers receive a full Ticket object.
          const partial = response.data!;
          const cached = this.ticketsValue.find((t) => t.id === partial.id);
          if (cached) {
            const updated: Ticket = { ...cached, status: partial.status };
            // Reflect the change in the tickets list subject
            const updatedList = this.ticketsValue.map((t) =>
              t.id === partial.id ? updated : t
            );
            this.ticketsSubject.next(updatedList);
            return updated;
          }
          // Fallback: return a minimal Ticket-shaped object
          return { id: partial.id, status: partial.status } as Ticket;
        }),
        catchError((error) => {
          const message = this.extractErrorMessage(error);
          return throwError(() => new Error(message));
        })
      );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private buildParams(params?: TicketListParams): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page != null) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit != null) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if ((params as any).site) {
        httpParams = httpParams.set('site', (params as any).site);
      }
    }

    return httpParams;
  }

  private extractErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors?.length > 0) {
      return error.error.errors.map((e: any) => e.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
