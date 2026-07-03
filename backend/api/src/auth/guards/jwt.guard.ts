import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard JWT authentication guard.
 * Apply to any route that requires a valid access token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
