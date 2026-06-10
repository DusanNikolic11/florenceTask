import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ServiceError } from './errors';

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
};

export const registerUser = async (
  email: string,
  password: string
): Promise<{ accessToken: string }> => {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ServiceError('CONFLICT', 'Email already registered');
  }

  const passwordHash = await argon2.hash(password);
  const user = await User.create({ email, passwordHash });

  return { accessToken: signToken(user._id.toString()) };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ accessToken: string }> => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new ServiceError('FORBIDDEN', 'Invalid credentials');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new ServiceError('FORBIDDEN', 'Invalid credentials');
  }

  return { accessToken: signToken(user._id.toString()) };
};
