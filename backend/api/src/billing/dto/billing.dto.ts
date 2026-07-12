import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { BillStatus } from '@prisma/client';

export class BillQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  declare page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  declare limit?: number;

  @IsOptional()
  @IsEnum(BillStatus)
  declare status?: BillStatus;
}

export class VerifyPaymentDto {
  @IsString()
  declare razorpayOrderId: string;

  @IsString()
  declare razorpayPaymentId: string;

  @IsString()
  declare razorpaySignature: string;
}
