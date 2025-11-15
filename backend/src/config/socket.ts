import { Server } from 'socket.io';

// Create a placeholder for the Socket.IO instance
// This will be initialized in server.ts
let io: Server | null = null;

export function setSocketIO(socketInstance: Server) {
  io = socketInstance;
  console.log('✅ Socket.IO instance set');
}

export function getSocketIO(): Server | null {
  return io;
}

// Emit event to specific user
export function emitToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Emit event to school
export function emitToSchool(schoolId: number, event: string, data: any) {
  if (io) {
    io.to(`school:${schoolId}`).emit(event, data);
  }
}

// Emit event to catering
export function emitToCatering(cateringId: number, event: string, data: any) {
  if (io) {
    io.to(`catering:${cateringId}`).emit(event, data);
  }
}

// Emit event to all admins
export function emitToAdmins(event: string, data: any) {
  if (io) {
    io.to('admin').emit(event, data);
  }
}

// Broadcast to all connected clients
export function broadcast(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
