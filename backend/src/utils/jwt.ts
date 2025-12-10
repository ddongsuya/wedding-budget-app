import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
// Access Token: 1시간 (보안 강화)
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
// Refresh Token: 30일
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateAccessToken = (userId: number, email: string): string => {
  return jwt.sign(
    { id: userId, email }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN } as any
  );
};

export const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { id: userId }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as any
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
