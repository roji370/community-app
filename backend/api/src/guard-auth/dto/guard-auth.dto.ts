import { IsString, IsNotEmpty, Length } from 'class-validator';

export class GuardLoginDto {
  @IsString()
  @IsNotEmpty()
  declare staffId: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  declare pin: string;
}
