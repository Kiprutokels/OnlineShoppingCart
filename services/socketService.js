import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  // Admin namespace
  const adminNamespace = io.of('/admin');

  // Authentication middleware for admin namespace
  adminNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token not provided'));
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Invalid authentication token'));
      }
      
      if (decoded.role !== 'admin') {
        return next(new Error('Unauthorized access, admin role required'));
      }
      
      socket.user = decoded;
      next();
    });
  });

  adminNamespace.on('connection', (socket) => {
    console.log(`Admin socket connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`Admin socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitDeviceStatusUpdate = (deviceData) => {
  if (!io) return;
  
  io.of('/admin').emit('deviceStatusUpdate', deviceData);
};

export const emitDeviceMetricsUpdate = (metricsData) => {
  if (!io) return;
  
  io.of('/admin').emit('deviceMetricsUpdate', metricsData);
};

export const emitOutageAlert = (outageData) => {
  if (!io) return;
  
  io.of('/admin').emit('outageAlert', outageData);
};