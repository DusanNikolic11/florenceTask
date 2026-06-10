import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { handleError } from '../services/errors';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const result = await registerUser(email, password);
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res, 'register');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (err) {
    handleError(err, res, 'login');
  }
};
