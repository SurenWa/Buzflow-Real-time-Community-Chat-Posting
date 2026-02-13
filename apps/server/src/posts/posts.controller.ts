/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UsersService } from '../users/users.service';

@Controller('posts')
@UseGuards(AccessTokenGuard)
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
  ) {}

  @Post()
  async createPost(@Req() req: any, @Body() body: { content: string }) {
    const user = await this.usersService.findById(req.user.userId);
    return this.postsService.createPost(
      req.user.userId,
      user?.name || 'Someone',
      body.content,
    );
  }

  @Get('feed')
  async getFeed() {
    return this.postsService.getFeed();
  }
}
