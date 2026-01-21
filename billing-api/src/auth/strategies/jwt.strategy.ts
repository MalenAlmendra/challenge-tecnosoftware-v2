import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const mockAuth = configService.get<string>('MOCK_AUTH', 'true') === 'true';
    const jwksUri = configService.get<string>('COGNITO_JWKS_URI');
    const issuer = configService.get<string>('COGNITO_ISSUER');
    const audience = configService.get<string>('COGNITO_AUDIENCE');

    const baseOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      audience,
    };

    if (!mockAuth && jwksUri) {
      super({
        ...baseOptions,
        secretOrKeyProvider: jwksRsa.passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri,
        }),
      });
    } else {
      super({
        ...baseOptions,
        secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });
    }
  }

  async validate(payload: any) {
    if (!payload.sub && !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub || payload.username,
      username: payload.username || payload.sub,
      email: payload.email,
      roles: payload['cognito:groups'] || payload.roles || [],
    };
  }
}
