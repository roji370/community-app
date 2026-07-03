import { ComplaintPriority, NotificationCategory, VisitorEntryType } from './enums';

// ──────────────────────────────────────────────────────────────
// SLA Durations (in hours) per complaint priority
// Used to calculate slaDueAt = createdAt + SLA_HOURS[priority]
// ──────────────────────────────────────────────────────────────

export const SLA_HOURS: Record<ComplaintPriority, number> = {
  [ComplaintPriority.HIGH]: 24,
  [ComplaintPriority.MEDIUM]: 72,
  [ComplaintPriority.LOW]: 168, // 7 days
};

// ──────────────────────────────────────────────────────────────
// Notification category metadata
// ──────────────────────────────────────────────────────────────

export interface NotificationCategoryMeta {
  label: string;
  description: string;
  /** Whether the resident can toggle this category off */
  isUserToggleable: boolean;
  /** Whether this category can send push notifications */
  canPush: boolean;
  /** Default enabled state for new users */
  defaultEnabled: boolean;
}

export const NOTIFICATION_CATEGORY_META: Record<NotificationCategory, NotificationCategoryMeta> = {
  [NotificationCategory.SECURITY]: {
    label: 'Security Alerts',
    description: 'Visitor approvals, gate alerts, and safety notifications',
    isUserToggleable: false, // LOCKED ON — safety-critical, deliberate product decision
    canPush: true,
    defaultEnabled: true,
  },
  [NotificationCategory.BILLING]: {
    label: 'Billing & Payments',
    description: 'Bill reminders, payment confirmations, and receipts',
    isUserToggleable: true,
    canPush: true,
    defaultEnabled: true,
  },
  [NotificationCategory.SOCIETY_NOTICE]: {
    label: 'Society Notices',
    description: 'Announcements, events, and policy updates from your society',
    isUserToggleable: true,
    canPush: true,
    defaultEnabled: true,
  },
  [NotificationCategory.COMPLAINT_UPDATE]: {
    label: 'Complaint Updates',
    description: 'Status changes on your filed complaints',
    isUserToggleable: true,
    canPush: true,
    defaultEnabled: true,
  },
  [NotificationCategory.COMMERCIAL]: {
    label: 'Promotions',
    description: 'Optional offers and services from verified vendors',
    isUserToggleable: true,
    canPush: false, // NEVER pushed — PRD §4.1 hard rule
    defaultEnabled: false, // Off by default, opt-in only
  },
};

// ──────────────────────────────────────────────────────────────
// Visitor expiry durations (in hours)
// ──────────────────────────────────────────────────────────────

export const VISITOR_EXPIRY_HOURS: Record<VisitorEntryType, number | null> = {
  [VisitorEntryType.ONE_TIME]: 24,
  [VisitorEntryType.SCHEDULED]: 4, // 4 hours from expected time
  [VisitorEntryType.RECURRING]: null, // No auto-expiry, must be manually revoked
};

// ──────────────────────────────────────────────────────────────
// Visitor approval timeout (seconds)
// Configurable via env, this is the default fallback
// ──────────────────────────────────────────────────────────────

export const DEFAULT_VISITOR_APPROVAL_TIMEOUT_SECONDS = 90;

// ──────────────────────────────────────────────────────────────
// Complaint reopen window (days after resolution)
// ──────────────────────────────────────────────────────────────

export const COMPLAINT_REOPEN_WINDOW_DAYS = 7;

// ──────────────────────────────────────────────────────────────
// Auth constants
// ──────────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS_PER_WINDOW = 3;
export const OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// ──────────────────────────────────────────────────────────────
// Pagination defaults
// ──────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
