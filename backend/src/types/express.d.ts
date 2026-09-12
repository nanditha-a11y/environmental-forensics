import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'investigator' | 'analyst';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}