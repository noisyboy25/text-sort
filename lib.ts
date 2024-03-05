import crypto from 'crypto';

export const generateRandString = (length: number = 16) =>
  crypto.randomBytes(length / 2).toString('hex');
