// ──────────────────────────────────────────────────────────────
// Notification Categories — PRD §7.3 hard rule enforcement
// COMMERCIAL notifications must NEVER have isPush: true.
// SECURITY notifications must NEVER be user-disableable.
// These are product trust promises, not bugs to "fix" later.
// ──────────────────────────────────────────────────────────────

export enum NotificationCategory {
  /** Visitor at gate, panic alert, loitering alert — LOCKED ON, cannot be disabled */
  SECURITY = 'SECURITY',
  /** Bill reminders, payment confirmations */
  BILLING = 'BILLING',
  /** Society announcements, policy changes */
  SOCIETY_NOTICE = 'SOCIETY_NOTICE',
  /** Complaint status changes */
  COMPLAINT_UPDATE = 'COMPLAINT_UPDATE',
  /** Commercial/promotional — NEVER pushed, opt-in tab only */
  COMMERCIAL = 'COMMERCIAL',
}

// ──────────────────────────────────────────────────────────────
// User & Auth
// ──────────────────────────────────────────────────────────────

export enum UserRole {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  HOUSEHOLD_MEMBER = 'HOUSEHOLD_MEMBER',
}

export enum UserStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  OFFBOARDED = 'OFFBOARDED',
}

// ──────────────────────────────────────────────────────────────
// Visitors
// ──────────────────────────────────────────────────────────────

export enum VisitorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
}

export enum VisitorEntryType {
  ONE_TIME = 'ONE_TIME',
  SCHEDULED = 'SCHEDULED',
  RECURRING = 'RECURRING',
}

export enum VisitorCreatedBy {
  RESIDENT = 'RESIDENT',
  GUARD = 'GUARD',
}

// ──────────────────────────────────────────────────────────────
// Complaints
// ──────────────────────────────────────────────────────────────

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
}

export enum ComplaintCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  SECURITY = 'SECURITY',
  COMMON_AREA = 'COMMON_AREA',
  OTHER = 'OTHER',
}

// ──────────────────────────────────────────────────────────────
// Billing
// ──────────────────────────────────────────────────────────────

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

// ──────────────────────────────────────────────────────────────
// Purpose categories for visitor entries
// ──────────────────────────────────────────────────────────────

export enum VisitorPurpose {
  GUEST = 'GUEST',
  DELIVERY = 'DELIVERY',
  CAB = 'CAB',
  DOMESTIC_HELP = 'DOMESTIC_HELP',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER',
}
