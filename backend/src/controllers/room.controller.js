import { ApiError } from '../exeptions/api.error.js';
import { roomService } from '../services/room.service.js';

const getAll = async (req, res, next) => {
  const { userId } = req.query;

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const rooms = await roomService.getUserRooms(Number(userId));

  res.status(200).json(rooms);
};

const create = async (req, res, next) => {
  const { name, userId } = req.body;

  if (!name || name.trim() === '') {
    return next(ApiError.badRequest('Room name is required'));
  }

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const newRoom = await roomService.createRoom(name.trim(), Number(userId));

  const io = req.app.get('io');

  io.to(`user:${userId}`).emit('room_created', newRoom);

  res.status(200).json(newRoom);
};

const rename = async (req, res, next) => {
  const { id } = req.params;
  const { newName, userId } = req.body;

  if (!newName || newName.trim() === '') {
    return next(ApiError.badRequest('New Name is required'));
  }

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const memberIds = await roomService.getMemberIds(id);
  const updatedRoom = await roomService.renameRoom(
    id,
    Number(userId),
    newName.trim(),
  );

  const io = req.app.get('io');

  memberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit('room_renamed', {
      roomId: id,
      newName: updatedRoom.name,
    });
  });

  res.status(200).json(updatedRoom);
};

const remove = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const memberIds = await roomService.getMemberIds(id);
  const result = await roomService.deleteRoom(id, Number(userId));

  const io = req.app.get('io');

  memberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit('room_deleted', { roomId: id });
  });

  io.in(String(id)).disconnectSockets();

  res.status(200).json(result);
};

const addMember = async (req, res, next) => {
  const { id } = req.params;
  const { userId, username } = req.body;

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  if (!username || username.trim() === '') {
    return next(ApiError.badRequest('Username is required'));
  }

  const { room, user } = await roomService.addMember(
    id,
    Number(userId),
    username.trim(),
  );

  const io = req.app.get('io');

  io.to(`user:${user.id}`).emit('room_created', room);

  res.status(200).json({
    success: true,
    message: 'Member added',
    roomId: Number(id),
    userId: user.id,
  });
};

const leave = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(ApiError.badRequest('User id is required'));
  }

  const result = await roomService.leaveRoom(id, Number(userId));

  const io = req.app.get('io');

  io.to(`user:${userId}`).emit('room_deleted', { roomId: id });
  io.in(`user:${userId}`).socketsLeave(String(id));

  res.status(200).json(result);
};

export const roomController = {
  getAll,
  create,
  remove,
  rename,
  addMember,
  leave,
};
