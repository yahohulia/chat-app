import { Op } from 'sequelize';
import { User } from '../models/index.js';

export const loginUser = async (username) => {
  const [user] = await User.findOrCreate({
    where: { username: username },
  });

  return user;
};

const searchUsers = async (query, excludeUserId) => {
  const where = {
    username: { [Op.iLike]: `%${query}%` },
  };

  if (Number.isInteger(excludeUserId)) {
    where.id = { [Op.ne]: excludeUserId };
  }

  return User.findAll({
    where,
    attributes: ['id', 'username'],
    limit: 10,
  });
};

export const userService = {
  loginUser,
  searchUsers,
};
