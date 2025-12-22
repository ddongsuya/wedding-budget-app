import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
// Access Token: 1시간 (Requirements 7.2)
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
// Refresh Token: 7일 (Requirements 7.2)
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Export expiration times in milliseconds for cookie maxAge
export const JWT_ACCESS_EXPIRES_MS = 60 * 60 * 1000; // 1 hour
export const JWT_REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
