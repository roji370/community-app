import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { NotificationCategory } from '@community/shared-types';

export class OnboardUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  societyId!: string;

  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @IsOptional()
  @IsEnum(['OWNER', 'TENANT', 'HOUSEHOLD_MEMBER'])
  role?: 'OWNER' | 'TENANT' | 'HOUSEHOLD_MEMBER';
}

export class UpdateNotificationPreferenceDto {
  @IsEnum(NotificationCategory)
  declare category: NotificationCategory;

  @IsBoolean()
  declare enabled: boolean;
}
