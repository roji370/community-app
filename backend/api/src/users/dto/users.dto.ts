import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

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
