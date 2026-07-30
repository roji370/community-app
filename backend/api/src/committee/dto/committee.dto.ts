import { IsOptional, IsString, IsInt, Min, IsEnum, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory, VisitorStatus, BillStatus } from '@prisma/client';

// ── Shared pagination ─────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

// ── Visitor queries ───────────────────────────────────────────────────

export class VisitorQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(VisitorStatus)
  status?: VisitorStatus;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

// ── Complaint queries ─────────────────────────────────────────────────

export class ComplaintQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsString()
  unitId?: string;
}

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus, {
    message: 'Status must be ACKNOWLEDGED, IN_PROGRESS, or RESOLVED',
  })
  newStatus!: ComplaintStatus;
}

// ── Billing queries ───────────────────────────────────────────────────

export class BillingQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @IsOptional()
  @IsString()
  unitId?: string;
}

// ── Notice creation ───────────────────────────────────────────────────

export class CreateNoticeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;
}

export class NoticeQueryDto extends PaginationDto {}
