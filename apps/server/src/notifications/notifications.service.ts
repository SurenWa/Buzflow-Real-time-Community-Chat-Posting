import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../models/schemas';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create notifications for all subscribers when a post is made
  async createPostNotifications(
    authorId: string,
    authorName: string,
    postId: string,
    subscriberIds: string[],
  ) {
    const notifications = subscriberIds.map((recipientId) => ({
      recipientId: new Types.ObjectId(recipientId),
      fromUserId: new Types.ObjectId(authorId),
      postId: new Types.ObjectId(postId),
      type: 'new_post',
      message: `${authorName} made a new post.`,
      read: false,
    }));

    return this.notificationModel.insertMany(notifications);
  }

  // Get notifications for a user (newest first)
  async getMyNotifications(userId: string, limit = 20) {
    return this.notificationModel
      .find({ recipientId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('fromUserId', 'name email')
      .lean();
  }

  // Unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      read: false,
    });
  }

  // Mark all as read
  async markAllRead(userId: string) {
    await this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
    return { message: 'All notifications marked as read' };
  }

  // Mark one as read
  async markRead(notificationId: string, userId: string) {
    await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      { read: true },
    );
    return { message: 'Notification marked as read' };
  }
}
