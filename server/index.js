import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { initDatabase } from './database.js';
import { authRouter } from './auth.js';
import { userRoutes } from './routes/userRoutes.js';
import { groupRoutes } from './routes/groupRoutes.js';
import { authenticateSocket } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupChatSocket } from './sockets/chatSocket.js';
import { setupGroupSocket } from './sockets/groupSocket.js';

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json({ limit: '25mb' })); // Support Base64 audio / media payloads

// REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// Global Error Handler
app.use(errorHandler);

// HTTP & Socket.IO Server Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  maxHttpBufferSize: 1e7, // 10MB payload limit
});

// Active sockets and user mappings
const activeUsersByUserId = new Map(); // userId -> { id, username, socketId, publicKey, status, joinedAt }
const socketToUserId = new Map();       // socket.id -> userId

// Authenticate Socket.IO connections via JWT guard
io.use(authenticateSocket);

// Socket.IO event delegation
io.on('connection', (socket) => {
  setupChatSocket(io, socket, activeUsersByUserId, socketToUserId);
  setupGroupSocket(io, socket, activeUsersByUserId);
});

// Start Server after Database Initialization
initDatabase().then(() => {
  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  CipherChat WhatsApp-Style E2EE Server (Node.js)    `);
    console.log(`  Port: ${config.port}                              `);
    console.log(`  Architecture: REST APIs + Socket.IO + Zero-Knowledge `);
    console.log(`====================================================`);
  });
});
