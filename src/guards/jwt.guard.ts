import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from 'lib/common/decorators';
import { AuthService } from 'src/auth/auth.service';
import { Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'No token provided',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.AUTH_TOKEN_SECRET_KEY, // must match your access token secret
      });

      const userId = payload.sub;
      const user = await this.authService.userReadById(userId);

      if (!user || user.isDeleted) {
        throw new UnauthorizedException({
          success: false,
          message: 'User not found or deleted',
        });
      }

      request['user'] = user; // or just assign payload if you prefer
      return true;
    } catch (err) {
      console.error('JWT verification failed:', err.message);
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    console.log(authHeader);
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
