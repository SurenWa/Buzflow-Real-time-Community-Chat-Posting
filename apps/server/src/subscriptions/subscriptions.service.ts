import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  User,
  UserDocument,
} from '../models/schemas';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async subscribe(subscriberId: string, subscribedToId: string) {
    if (subscriberId === subscribedToId) {
      throw new ConflictException('Cannot subscribe to yourself');
    }

    try {
      await this.subscriptionModel.create({
        subscriberId: new Types.ObjectId(subscriberId),
        subscribedToId: new Types.ObjectId(subscribedToId),
      });
      return { message: 'Subscribed' };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err.code === 11000) {
        throw new ConflictException('Already subscribed');
      }
      throw err;
    }
  }

  async unsubscribe(subscriberId: string, subscribedToId: string) {
    await this.subscriptionModel.deleteOne({
      subscriberId: new Types.ObjectId(subscriberId),
      subscribedToId: new Types.ObjectId(subscribedToId),
    });
    return { message: 'Unsubscribed' };
  }

  // Get users I'm subscribed to (for sidebar)
  async getMySubscriptions(subscriberId: string) {
    const subs = await this.subscriptionModel
      .find({ subscriberId: new Types.ObjectId(subscriberId) })
      .lean();

    const userIds = subs.map((s) => s.subscribedToId);

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email isOnline lastSeen')
      .lean();

    return users;
  }

  // Get users who are subscribed to me (for sending notifications)
  async getSubscribers(userId: string): Promise<string[]> {
    const subs = await this.subscriptionModel
      .find({ subscribedToId: new Types.ObjectId(userId) })
      .lean();

    return subs.map((s) => s.subscriberId.toString());
  }

  // Check if user A is subscribed to user B
  async isSubscribed(
    subscriberId: string,
    subscribedToId: string,
  ): Promise<boolean> {
    const sub = await this.subscriptionModel.findOne({
      subscriberId: new Types.ObjectId(subscriberId),
      subscribedToId: new Types.ObjectId(subscribedToId),
    });
    return !!sub;
  }
}
