import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guards routes that require ACTIVE user status.
 * Blocks PENDING_APPROVAL users from accessing app features
 * with a meaningful error message (not just a generic 403).
 *
 * Use AFTER JwtAuthGuard — this reads the user attached by JWT validation.
 */
@Injectable()
export class ActiveStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Onboarding tokens are allowed through (they need to hit /users/onboard)
    if (user.isOnboarding) {
      return true;
    }

    if (user.status === 'PENDING_APPROVAL') {
      throw new ForbiddenException({
        message: 'Your account is pending committee approval. You will be notified once approved.',
        code: 'PENDING_APPROVAL',
        status: 'PENDING_APPROVAL',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        message: 'Your account is not active. Please contact your society administrator.',
        code: 'ACCOUNT_INACTIVE',
        status: user.status,
      });
    }

    return true;
  }
}
