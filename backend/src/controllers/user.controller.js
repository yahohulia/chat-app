import { userService } from '../services/user.service.js';

const search = async (req, res, next) => {
  const { query, userId } = req.query;

  if (!query || query.trim() === '') {
    return res.status(200).json([]);
  }

  const users = await userService.searchUsers(query.trim(), Number(userId));

  res.status(200).json(users);
};

export const userController = {
  search,
};
