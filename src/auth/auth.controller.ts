import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  LoginResponseDataDto,
  SessionResponseDto,
  UserMeResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description:
      'Authenticates user credentials, issues a short-lived JWT Access Token, creates a database session with device tracking, and sets an HTTP-only Refresh Token cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated.',
    type: LoginResponseDataDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or user account no longer exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (e.g. invalid email format or missing password).',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDataDto> {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    return this.authService.login(dto, res, { ipAddress, userAgent });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Authenticated User Profile',
    description:
      'Fetches profile metadata for the authenticated user alongside their active logged-in device sessions list.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user profile and active device sessions.',
    type: UserMeResponseDto,
  })
  async getMe(@Req() req: any): Promise<UserMeResponseDto> {
    return this.authService.getMe(req.user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List Active Logged-In Sessions',
    description:
      'Lists all active logged-in device sessions (IP, User Agent, device name, expiration) for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved active sessions list.',
    type: [SessionResponseDto],
  })
  async getSessions(@Req() req: any): Promise<SessionResponseDto[]> {
    return this.authService.getActiveSessions(req.user.id);
  }
}
