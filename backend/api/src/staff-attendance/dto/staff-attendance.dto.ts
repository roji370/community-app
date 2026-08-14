import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { StaffType } from '@prisma/client';

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  declare staffName: string;

  @IsEnum(StaffType)
  declare staffType: StaffType;

  @IsString()
  @IsOptional()
  declare unitId?: string;
}
