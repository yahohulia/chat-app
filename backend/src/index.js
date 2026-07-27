'use strict';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { authRouter } from './routes/auth.route.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { roomRouter } from './routes/room.route.js';
import { userRouter } from './routes/user.route.js';
import { messageService } from './services/message.service.js';
import { roomService } from './services/room.service.js';

const PORT = process.env.PORT || 3005;

const allowedOrigins = (process.env.CLIENT_HOST || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
};

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json());

app.use('/', authRouter);
app.use('/rooms', roomRouter);
app.use('/users', userRouter);

app.use(errorMiddleware);

io.on('connection', (socket) => {
  socket.on('identify', (userId) => {
    socket.data.userId = Number(userId);
    socket.join(`user:${userId}`);
  });

  socket.on('join_room', async (roomId) => {
    const isMember = await roomService.isMember(roomId, socket.data.userId);

    if (isMember) {
      socket.join(String(roomId));
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { text, userId, roomId } = data;

      if (!text || !text.trim()) {
        socket.emit('message_error', {
          message: 'Message text cannot be empty',
        });
        return;
      }

      const isMember = await roomService.isMember(roomId, Number(userId));

      if (!isMember) {
        socket.emit('message_error', {
          message: 'You are not a member of this room',
        });
        return;
      }

      const savedMessage = await messageService.createMessage(
        text.trim(),
        userId,
        roomId,
      );

      io.to(String(roomId)).emit('receive_message', savedMessage);
    } catch (error) {
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {});
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on localhost:${PORT}`);
});
