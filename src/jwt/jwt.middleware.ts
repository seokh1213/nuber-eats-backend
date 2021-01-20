import { UsersService } from './../users/users.service';
import { JwtService } from './jwt.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt'];
      try {
        const decoded = this.jwtService.verify(token.toString());
        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
          const { user, ok } = await this.usersService.findById(decoded['id']);
          if (ok) req['user'] = user;
        }
      } catch (e) {
        // jwt is not valid or DB error
        req['user'] = null;
      }
    }
    next();
  }
}
