import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGuardStore } from '../store/guardStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

export interface VisitorResult {
  visitorId: string;
  status: 'APPROVED' | 'DENIED' | 'EXPIRED';
  residentName?: string;
  resolvedAt: string;
}

let guardSocket: Socket | null = null;

export function useGuardSocket({
  onVisitorResult,
}: {
  onVisitorResult?: (result: VisitorResult) => void;
}) {
  const { accessToken, guard } = useGuardStore();
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onVisitorResult);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => { callbackRef.current = onVisitorResult; }, [onVisitorResult]);

  const connect = useCallback(() => {
    if (!accessToken || !guard?.id) return;
    if (guardSocket?.connected) {
      socketRef.current = guardSocket;
      setIsConnected(true);
      return;
    }

    const socket = io(`${API_URL}/gate`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => {
      console.log('[Guard WS] Connected');
      socket.emit('join:guard', { guardId: guard.id, token: accessToken });
      setIsConnected(true);
    });

    socket.on('visitor:result', (data: VisitorResult) => {
      console.log('[Guard WS] visitor:result', data.status);
      callbackRef.current?.(data);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;
    guardSocket = socket;
  }, [accessToken, guard?.id]);

  useEffect(() => {
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    guardSocket?.disconnect();
    guardSocket = null;
    socketRef.current = null;
  }, []);

  return { isConnected, disconnect };
}
