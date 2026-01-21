import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AppAuthGuard extends JwtAuthGuard {
  constructor(
    reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const mockAuth = this.configService.get<string>('MOCK_AUTH', 'true') === 'true';
    const authHeader = request.headers.authorization as string | undefined;

    if (mockAuth) {
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        try {
          const payload = this.jwtService.verify(token);
          request.user = this.mapPayload(payload);
          return true;
        } catch (error) {
          throw new UnauthorizedException('Invalid or missing token');
        }
      }

      request.user = {
        userId: 'mock-user',
        username: 'mock-user',
        email: 'mock-user@example.com',
        roles: ['USER'],
      };
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  private mapPayload(payload: any) {
    return {
      userId: payload.sub || payload.username,
      username: payload.username || payload.sub,
      email: payload.email,
      roles: payload['cognito:groups'] || payload.roles || [],
    };
  }
}
