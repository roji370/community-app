import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ComplaintStatus, ComplaintCategory, ComplaintPriority } from '@prisma/client';

export class ComplaintQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare limit?: number;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  declare status?: ComplaintStatus;
}

export class CreateComplaintDto {
  @IsEnum(ComplaintCategory)
  declare category: ComplaintCategory;

  @IsString()
  declare description: string;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  declare priority?: ComplaintPriority;

  @IsOptional()
  @IsString({ each: true })
  declare photoUrls?: string[];
}

export class ReopenComplaintDto {
  @IsOptional()
  @IsString()
  declare reason?: string;
}
