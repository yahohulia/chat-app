import { ApiError } from '../exeptions/api.error.js';
import { Room, User } from '../models/index.js';

const getUserRooms = async (userId) => {
  return Room.findAll({
    include: [
      {
        model: User,
        where: { id: userId },
        attributes: [],
      },
    ],
  });
};

const getRoomOrThrow = async (roomId) => {
  const room = await Room.findByPk(roomId);

  if (!room) {
    throw ApiError.notFound('Room not found');
  }

  return room;
};

const isMember = async (roomId, userId) => {
  const room = await Room.findByPk(roomId, {
    include: [{ model: User, where: { id: userId }, attributes: [] }],
  });

  return Boolean(room);
};

const getMemberIds = async (roomId) => {
  const room = await Room.findByPk(roomId, {
    include: [{ model: User, attributes: ['id'] }],
  });

  return room ? room.users.map((user) => user.id) : [];
};

const createRoom = async (name, ownerId) => {
  const newRoom = await Room.create({ name, ownerId });

  await newRoom.addUser(ownerId);

  return newRoom;
};

const renameRoom = async (roomId, requesterId, newName) => {
  const room = await getRoomOrThrow(roomId);

  if (room.ownerId !== requesterId) {
    throw ApiError.forbidden('Only the room owner can rename this room');
  }

  room.name = newName;
  await room.save();

  return room;
};

const deleteRoom = async (roomId, requesterId) => {
  const room = await getRoomOrThrow(roomId);

  if (room.ownerId !== requesterId) {
    throw ApiError.forbidden('Only the room owner can delete this room');
  }

  await room.destroy();

  return {
    success: true,
    message: 'Room successfully deleted',
    roomId: Number(roomId),
  };
};

const addMember = async (roomId, requesterId, username) => {
  const room = await getRoomOrThrow(roomId);

  if (room.ownerId !== requesterId) {
    throw ApiError.forbidden('Only the room owner can add members');
  }

  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const alreadyMember = await isMember(roomId, user.id);

  if (alreadyMember) {
    throw ApiError.badRequest('User is already a member of this room');
  }

  await room.addUser(user);

  return { room, user };
};

const leaveRoom = async (roomId, userId) => {
  const room = await getRoomOrThrow(roomId);

  if (room.ownerId === userId) {
    throw ApiError.badRequest(
      'Room owner cannot leave the room — delete it instead',
    );
  }

  await room.removeUser(userId);

  return {
    success: true,
    message: 'Left the room',
    roomId: Number(roomId),
  };
};

export const roomService = {
  getUserRooms,
  createRoom,
  renameRoom,
  deleteRoom,
  addMember,
  leaveRoom,
  isMember,
  getMemberIds,
};
