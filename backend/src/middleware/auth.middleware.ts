import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) {
      res.status(500).json({ message: 'Authentication error' });
      return;
    }
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: invalid or missing token' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};
