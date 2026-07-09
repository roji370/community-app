import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { VisitorPurpose } from '@prisma/client';

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
