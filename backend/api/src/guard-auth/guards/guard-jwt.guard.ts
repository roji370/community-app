import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuardJwtAuthGuard extends AuthGuard('guard-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
