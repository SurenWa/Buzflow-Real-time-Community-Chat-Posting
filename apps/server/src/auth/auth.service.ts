import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../models/schemas';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type TokenPayload = {
  sub: string; // userId
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ─── Register ──────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthTokens> {
    // Check if email already exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
    });
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  // ─── Login ─────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
    });
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  // ─── Refresh ───────────────────────────────────
  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    // Compare the provided refresh token with the stored hash
    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches) {
      // Possible token reuse attack — invalidate all sessions
      await this.usersService.updateRefreshToken(userId, null);
      throw new UnauthorizedException('Access denied — token reuse detected');
    }

    // Rotation: issue new pair, invalidate old
    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
    });
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  // ─── Logout ────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  // ─── Helpers ───────────────────────────────────
  private async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(token, 10);
    await this.usersService.updateRefreshToken(userId, hashed);
  }
}
