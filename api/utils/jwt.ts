import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export const generateTokens = (user: IUser) => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    algorithm: 'HS256'
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateResetToken = (email: string): string => {
  return jwt.sign({ email }, process.env.JWT_SECRET!, {
    expiresIn: '1h'
  });
};

export const verifyResetToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    return decoded.email;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};