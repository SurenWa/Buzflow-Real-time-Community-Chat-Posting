/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UsersService } from '../users/users.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('posts')
@UseGuards(AccessTokenGuard)
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private chatGateway: ChatGateway,
  ) {}

  @Post()
  async createPost(@Req() req: any, @Body() body: { content: string }) {
    const user = await this.usersService.findById(req.user.userId);
    const authorName = user?.name || 'Someone';

    // 1) Create post + notifications in DB
    const result = await this.postsService.createPost(
      req.user.userId,
      authorName,
      body.content,
    );

    // 2) Push real-time notification to each subscriber via WebSocket
    for (const subscriberId of result.subscriberIds) {
      // Find the matching notification for this subscriber
      const notification = result.notifications.find(
        (n: any) => n.recipientId.toString() === subscriberId,
      );

      if (notification) {
        this.chatGateway.emitToUser(subscriberId, 'newNotification', {
          _id: notification._id.toString(),
          fromUserId: {
            _id: req.user.userId,
            name: authorName,
          },
          postId: result.post._id.toString(),
          type: 'new_post',
          message: `${authorName} made a new post.`,
          read: false,
          createdAt: notification.createdAt || new Date().toISOString(),
        });
      }
    }

    // 3) Return the post to the creator
    return result.post;
  }

  @Get('feed')
  async getFeed() {
    return this.postsService.getFeed();
  }
}
