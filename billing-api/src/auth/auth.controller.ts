import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { CognitoMockService } from './services/cognito-mock.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly cognitoMockService: CognitoMockService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with username and password (mock)' })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiResponse({ status: 400, description: 'Bad request - username and password required' })
  async login(@Body() loginDto: LoginDto) {
    return this.cognitoMockService.login(loginDto.username, loginDto.password);
  }
}
