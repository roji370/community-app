import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

export interface PendingVisitor {
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

export interface VisitorResult {
  visitorId: string;
  status: 'APPROVED' | 'DENIED' | 'EXPIRED';
  resolvedAt: string;
}

type EventCallback = (data: PendingVisitor) => void;
type ExpiredCallback = (data: VisitorResult) => void;

let socketInstance: Socket | null = null;

export function useWebSocket({
  onVisitorPending,
  onVisitorExpired,
}: {
  onVisitorPending?: EventCallback;
  onVisitorExpired?: ExpiredCallback;
} = {}) {
  const { accessToken, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const pendingCbRef = useRef(onVisitorPending);
  const expiredCbRef = useRef(onVisitorExpired);

  // Keep callbacks fresh without re-connecting
  useEffect(() => { pendingCbRef.current = onVisitorPending; }, [onVisitorPending]);
  useEffect(() => { expiredCbRef.current = onVisitorExpired; }, [onVisitorExpired]);

  const connect = useCallback(() => {
    if (!accessToken || !user?.unitId) return;
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const socket = io(`${API_URL}/gate`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to /gate');
      // Join unit room so we receive visitor:pending events
      socket.emit('join:unit', { unitId: user.unitId, token: accessToken });
    });

    socket.on('visitor:pending', (data: PendingVisitor) => {
      console.log('[WS] visitor:pending received', data.visitorId);
      pendingCbRef.current?.(data);
    });

    socket.on('visitor:expired', (data: VisitorResult) => {
      console.log('[WS] visitor:expired', data.visitorId);
      expiredCbRef.current?.(data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });

    socketRef.current = socket;
    socketInstance = socket;
  }, [accessToken, user?.unitId]);

  useEffect(() => {
    connect();
    return () => {
      // Don't disconnect on unmount — keep socket alive globally
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    socketInstance?.disconnect();
    socketInstance = null;
    socketRef.current = null;
  }, []);

  return { socket: socketRef.current, disconnect };
}
