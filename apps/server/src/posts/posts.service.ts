import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../models/schemas';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private subscriptionsService: SubscriptionsService,
    private notificationsService: NotificationsService,
  ) {}

  async createPost(authorId: string, authorName: string, content: string) {
    // 1) Create the post
    const post = await this.postModel.create({
      authorId: new Types.ObjectId(authorId),
      content,
    });

    // 2) Find all subscribers of this author
    const subscriberIds =
      await this.subscriptionsService.getSubscribers(authorId);

    // 3) Create notification records for each subscriber
    if (subscriberIds.length > 0) {
      await this.notificationsService.createPostNotifications(
        authorId,
        authorName,
        post._id.toString(),
        subscriberIds,
      );
    }

    // Return the post with author info
    return {
      ...post.toObject(),
      subscriberCount: subscriberIds.length,
    };
  }

  async getFeed(limit = 30) {
    return this.postModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name email')
      .lean();
  }

  async getPostsByUser(userId: string, limit = 20) {
    return this.postModel
      .find({ authorId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name email')
      .lean();
  }
}
