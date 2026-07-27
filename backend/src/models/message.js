import { DataTypes } from 'sequelize';
import { client } from '../utils/db.js';

export const Message = client.define(
  'message',
  {
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    updatedAt: false,
  },
);
