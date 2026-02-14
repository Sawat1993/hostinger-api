import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Fail fast if secret not configured — prevents accidental use of insecure default
      throw new Error('JWT_SECRET is not configured in ConfigService');
    }
    this.secret = secret;
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      const payload = jwt.verify(token, this.secret);
      // attach payload to request.user for handlers to use
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
