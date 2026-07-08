import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';

export interface VisitorPushPayload {
  visitorId: string;
  visitorName: string;
  purpose: string;
  guardName: string;
  photoUrl?: string;
  unitId: string;
  expiresAt: string;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const serviceAccountJson = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    );

    if (!serviceAccountJson) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled',
      );
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (getApps().length === 0) {
        this.app = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
      } else {
        this.app = getApps()[0];
      }
      this.logger.log('Firebase Admin SDK initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err);
    }
  }

  // Send visitor-at-gate push notification (SECURITY category — highest priority)
  async sendVisitorNotification(
    userId: string,
    payload: VisitorPushPayload,
  ): Promise<void> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized — skipping push notification');
      return;
    }

    const tokens = await this.prisma.fcmToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens for user ${userId}`);
      return;
    }

    const messaging = getMessaging(this.app);
    const staleTokenIds: string[] = [];

    await Promise.allSettled(
      tokens.map(async ({ id, token }) => {
        try {
          await messaging.send({
            token,
            notification: {
              title: `🔔 Visitor at Gate`,
              body: `${payload.visitorName} (${payload.purpose}) is waiting`,
            },
            data: {
              type: 'VISITOR_PENDING',
              visitorId: payload.visitorId,
              visitorName: payload.visitorName,
              purpose: payload.purpose,
              guardName: payload.guardName,
              photoUrl: payload.photoUrl ?? '',
              unitId: payload.unitId,
              expiresAt: payload.expiresAt,
              category: 'SECURITY', // SECURITY — never COMMERCIAL
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'interruption-level': 'time-sensitive',
                  'content-available': 1,
                },
              },
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'security_alerts',
                priority: 'max',
                sound: 'default',
              },
            },
          });
        } catch (err: unknown) {
          const errorCode = (err as { code?: string })?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            staleTokenIds.push(id);
          } else {
            this.logger.error(`FCM send failed for token ${id}:`, err);
          }
        }
      }),
    );

    if (staleTokenIds.length > 0) {
      await this.prisma.fcmToken.deleteMany({
        where: { id: { in: staleTokenIds } },
      });
      this.logger.log(`Cleaned up ${staleTokenIds.length} stale FCM tokens`);
    }
  }

  async upsertToken(userId: string, token: string, platform: string): Promise<void> {
    await this.prisma.fcmToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId },
    });
  }
}
