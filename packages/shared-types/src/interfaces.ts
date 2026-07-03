import {
  NotificationCategory,
  UserRole,
  UserStatus,
  VisitorStatus,
  VisitorEntryType,
  VisitorCreatedBy,
  VisitorPurpose,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintCategory,
  BillStatus,
} from './enums';

// ──────────────────────────────────────────────────────────────
// Core Entities
// ──────────────────────────────────────────────────────────────

export interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalUnits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  societyId: string;
  /** Display identifier, e.g. "A-402", "B-101" */
  identifier: string;
  /** Building/tower/block name */
  block?: string;
  floor?: number;
  createdAt: Date;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  unitId: string;
  societyId: string;
  role: UserRole;
  status: UserStatus;
  profilePhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// Visitors
// ──────────────────────────────────────────────────────────────

export interface Visitor {
  id: string;
  createdBy: VisitorCreatedBy;
  createdByUserId?: string; // null if guard-created
  unitId: string;
  societyId: string;
  name: string;
  phone?: string;
  photoUrl?: string; // captured by guard, if guard-initiated
  purpose: VisitorPurpose;
  purposeNote?: string;
  status: VisitorStatus;
  entryType: VisitorEntryType;
  /** For SCHEDULED visits */
  expectedAt?: Date;
  /** For RECURRING visits (e.g. "daily cook") */
  recurringSchedule?: string;
  /** When the resident responded (approved/denied) */
  respondedAt?: Date;
  respondedByUserId?: string;
  /** QR code data for pre-approved visitors */
  qrCode?: string;
  /** Shareable link for pre-approved visitors */
  shareableLink?: string;
  entryAt?: Date;
  exitAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// Complaints
// ──────────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  unitId: string;
  societyId: string;
  createdByUserId: string;
  category: ComplaintCategory;
  description: string;
  photoUrls: string[];
  priority: ComplaintPriority;
  status: ComplaintStatus;
  /**
   * Real, queryable SLA deadline — not cosmetic text.
   * Drives committee-side breach alerts and status dashboard.
   */
  slaDueAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  reopenedAt?: Date;
  /** Number of times reopened (track complaint quality) */
  reopenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// Billing
// ──────────────────────────────────────────────────────────────

export interface BillLineItem {
  label: string;
  amount: number;
}

export interface Bill {
  id: string;
  unitId: string;
  societyId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  breakdown: BillLineItem[];
  status: BillStatus;
  /** Razorpay payment ID for reconciliation */
  paymentId?: string;
  paidAt?: Date;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// Notices
// ──────────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  societyId: string;
  createdByUserId: string;
  title: string;
  body: string;
  /** Requires resident acknowledgment (e.g. "confirm you've read the parking policy") */
  requiresAcknowledgment: boolean;
  acknowledgedByUserIds: string[];
  category: NotificationCategory.SOCIETY_NOTICE;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// Notifications & Preferences
// ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  category: NotificationCategory;
  /**
   * MUST be false for COMMERCIAL category.
   * Enforced at DB level via CHECK constraint.
   * This is a product trust promise — see PRD §4.1.
   */
  isPush: boolean;
  userId: string;
  societyId: string;
  title: string;
  body: string;
  /** Deep link target in the app */
  actionUrl?: string;
  /** For SECURITY: visitor photo, etc. */
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: NotificationCategory;
  /**
   * SECURITY category is always true — cannot be disabled.
   * Enforced at DB level via CHECK constraint.
   * This is a deliberate product decision, not an oversight.
   */
  enabled: boolean;
}

// ──────────────────────────────────────────────────────────────
// Auth DTOs (request/response shapes)
// ──────────────────────────────────────────────────────────────

export interface OTPRequestDTO {
  phone: string;
}

export interface OTPVerifyDTO {
  phone: string;
  code: string;
}

export interface OTPVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: User | null;
  isNewUser: boolean;
}

export interface OnboardDTO {
  name: string;
  societyId: string;
  unitId: string;
  role?: UserRole;
}

export interface VisitorRespondDTO {
  decision: VisitorStatus.APPROVED | VisitorStatus.DENIED;
}

// ──────────────────────────────────────────────────────────────
// API Response Envelope
// ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
