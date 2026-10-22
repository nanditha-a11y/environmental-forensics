import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Realtime Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Realtime Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

export const emitRealtimeEvent = (
  event: 'INCIDENT_CREATED' | 'INCIDENT_UPDATED' | 'ALERT_TRIGGERED' | 'EVIDENCE_HASHED',
  payload: any
) => {
  if (io) {
    io.emit(event, payload);
    console.log(`📢 Realtime Event Emitted [${event}]:`, payload.id || payload.title || payload);
  }
};