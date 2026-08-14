import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { VisitorPurpose, VisitorEntryType } from '@prisma/client';

export class CreateVisitorDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsEnum(VisitorPurpose)
  declare purpose: VisitorPurpose;

  @IsString()
  @IsOptional()
  declare purposeNote?: string;

  @IsString()
  @IsNotEmpty()
  declare unitId: string;

  @IsString()
  @IsOptional()
  declare phone?: string;

  @IsString()
  @IsOptional()
  declare photoUrl?: string;
}

export class ResolveVisitorDto {
  @IsEnum(['APPROVED', 'DENIED'])
  declare action: 'APPROVED' | 'DENIED';
}

export class RegisterFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  declare token: string;

  @IsString()
  @IsNotEmpty()
  declare platform: string;
}

export class CreatePreApprovedVisitorDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsEnum(VisitorPurpose)
  declare purpose: VisitorPurpose;

  @IsString()
  @IsOptional()
  declare phone?: string;

  @IsEnum(['ONE_TIME', 'SCHEDULED'] as const)
  @IsOptional()
  declare entryType?: 'ONE_TIME' | 'SCHEDULED';

  @IsDateString()
  @IsOptional()
  declare expectedAt?: string;
}

export class ValidatePassDto {
  @IsString()
  @IsNotEmpty()
  declare code: string;
}
