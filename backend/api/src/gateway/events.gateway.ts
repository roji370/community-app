import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface VisitorPendingPayload {
  visitorId: string;
  name: string;
  purpose: string;
  photoUrl: string | null;
  guardName: string;
  unitId: string;
  societyId: string;
  expiresAt: string;
  createdAt: string;
}

export interface VisitorResultPayload {
  visitorId: string;
  status: 'APPROVED' | 'DENIED' | 'EXPIRED';
  residentName?: string;
  resolvedAt: string;
}

@WebSocketGateway({
  namespace: '/gate',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Resident joins their unit's room to receive visitor notifications
  @SubscribeMessage('join:unit')
  handleJoinUnit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { unitId: string; token: string },
  ) {
    try {
      this.jwtService.verify(data.token);
      const room = `unit:${data.unitId}`;
      void client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { success: true, room };
    } catch {
      client.disconnect();
      return { success: false, error: 'Unauthorized' };
    }
  }

  // Guard joins their personal room to receive approval results
  @SubscribeMessage('join:guard')
  handleJoinGuard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guardId: string; token: string },
  ) {
    try {
      this.jwtService.verify(data.token);
      const room = `guard:${data.guardId}`;
      void client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { success: true, room };
    } catch {
      client.disconnect();
      return { success: false, error: 'Unauthorized' };
    }
  }

  // Called by VisitorsService when a new gate visitor is created
  emitVisitorPending(unitId: string, payload: VisitorPendingPayload) {
    this.server.to(`unit:${unitId}`).emit('visitor:pending', payload);
    this.logger.log(`Emitted visitor:pending to unit:${unitId}`);
  }

  // Called by VisitorsService when resident approves/denies
  emitVisitorResult(guardId: string, payload: VisitorResultPayload) {
    this.server.to(`guard:${guardId}`).emit('visitor:result', payload);
    this.logger.log(`Emitted visitor:result to guard:${guardId} — ${payload.status}`);
  }

  // Called by scheduler when visitor expires without response
  emitVisitorExpired(unitId: string, guardId: string | null, visitorId: string) {
    const payload: VisitorResultPayload = {
      visitorId,
      status: 'EXPIRED',
      resolvedAt: new Date().toISOString(),
    };
    this.server.to(`unit:${unitId}`).emit('visitor:expired', payload);
    if (guardId) {
      this.server.to(`guard:${guardId}`).emit('visitor:result', payload);
    }
    this.logger.log(`Emitted visitor:expired for visitor ${visitorId}`);
  }
}
