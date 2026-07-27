import { Sequelize } from 'sequelize';

const commonOptions = {
  dialect: 'postgres',
  define: {
    underscored: true,
  },
};

export const client = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      ...commonOptions,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ...commonOptions,
    });
