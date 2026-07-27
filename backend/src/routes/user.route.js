import express from 'express';
import { catchError } from '../utils/catchError.js';
import { userController } from '../controllers/user.controller.js';

export const userRouter = express.Router();

userRouter.get('/', catchError(userController.search));
