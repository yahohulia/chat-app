import { ApiError } from '../exeptions/api.error.js';
import { messageService } from '../services/message.service.js';
import { roomService } from '../services/room.service.js';

const getByRoom = async (req, res, next) => {
  const { roomId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const isMember = await roomService.isMember(roomId, Number(userId));

  if (!isMember) {
    return next(ApiError.forbidden('You are not a member of this room'));
  }

  const messages = await messageService.getRoomMessages(roomId);

  res.status(200).json(messages);
};

const create = async (req, res, next) => {
  const { roomId } = req.params;
  const { text, userId } = req.body;

  if (!text || text.trim() === '') {
    return next(ApiError.badRequest('The message text cannot be empty'));
  }

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const isMember = await roomService.isMember(roomId, Number(userId));

  if (!isMember) {
    return next(ApiError.forbidden('You are not a member of this room'));
  }

  const newMessage = await messageService.createMessage(
    text.trim(),
    userId,
    roomId,
  );

  res.status(201).json(newMessage);
};

export const messageController = {
  getByRoom,
  create,
};
