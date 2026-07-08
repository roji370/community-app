import { Controller, Post, Body } from '@nestjs/common';
import { GuardAuthService } from './guard-auth.service';
import { GuardLoginDto } from './dto/guard-auth.dto';

@Controller('guard/auth')
export class GuardAuthController {
  constructor(private readonly guardAuthService: GuardAuthService) {}

  @Post('login')
  login(@Body() dto: GuardLoginDto) {
    return this.guardAuthService.login(dto);
  }
}
