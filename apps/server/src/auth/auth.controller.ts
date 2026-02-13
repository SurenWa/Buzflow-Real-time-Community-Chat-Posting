/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true in production (HTTPS)
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const tokens = await this.authService.register(dto);
    (res as Response).cookie(
      'refreshToken',
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    return { accessToken: tokens.accessToken };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const tokens = await this.authService.login(dto);
    (res as Response).cookie(
      'refreshToken',
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    return { accessToken: tokens.accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { userId, refreshToken } = req.user;
    const tokens = await this.authService.refresh(userId, refreshToken);
    (res as Response).cookie(
      'refreshToken',
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    return { accessToken: tokens.accessToken };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { userId } = req.user;
    await this.authService.logout(userId);
    (res as Response).clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out' };
  }

  @UseGuards(AccessTokenGuard)
  @Post('me')
  @HttpCode(200)
  async me(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { userId } = req.user;
    const user = await this.authService['usersService'].findById(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
    };
  }
}
