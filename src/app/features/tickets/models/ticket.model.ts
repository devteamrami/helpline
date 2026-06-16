export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SenderType = 'user' | 'staff';

export interface Ticket {
  id: string;
  ticketName: string;
  description: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  employeeCode: string;
  siteId: string;
  siteName: string;
  pageUrl: string;
  status: TicketStatus;
  lastReplyBy: SenderType | null;
  lastRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  s3Key: string;
  originalName: string;
}

export interface ConversationEntry {
  id: string;
  ticketId: string;
  senderType: SenderType;
  senderId: string;
  senderFirstName?: string;
  senderLastName?: string;
  message: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  conversations: ConversationEntry[];
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  search?: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
}

export interface UpdateFaqRequest {
  question?: string;
  answer?: string;
  isActive?: boolean;
}

export interface FaqListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | '';
}

export interface FaqListResponse {
  faqs: Faq[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
