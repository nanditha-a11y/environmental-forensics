import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';

// Extend Express Request interface to include user payload
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// 1. Middleware to verify JWT token
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ status: 'error', message: 'Invalid or expired token.' });
  }
};

// 2. Middleware for Role-Based Access Control (RBAC)
export const authorizeRoles = (...allowedRoles: Array<'admin' | 'investigator' | 'analyst'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'User not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden. Role '${req.user.role}' lacks permissions for this action.`,
      });
      return;
    }

    next();
  };
};
