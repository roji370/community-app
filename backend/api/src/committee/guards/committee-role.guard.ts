import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guards committee-only routes.
 * Only users with role OWNER can access committee dashboard endpoints.
 * In Indian societies, committee members are always unit owners.
 *
 * Use AFTER JwtAuthGuard + ActiveStatusGuard — reads the user attached by JWT validation.
 */
@Injectable()
export class CommitteeRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== 'OWNER') {
      throw new ForbiddenException({
        message: 'Committee dashboard access is restricted to society owners.',
        code: 'NOT_COMMITTEE_MEMBER',
        role: user.role,
      });
    }

    return true;
  }
}
