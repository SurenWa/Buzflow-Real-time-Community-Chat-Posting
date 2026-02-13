import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/schemas';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updateRefreshToken(
    userId: string,
    hashedToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedToken,
    });
  }

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const update: any = { isOnline };
    if (!isOnline) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      update.lastSeen = new Date();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.userModel.findByIdAndUpdate(userId, update);
  }
}
