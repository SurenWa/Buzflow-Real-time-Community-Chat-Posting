/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('subscriptions')
@UseGuards(AccessTokenGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // GET /subscriptions/mine — users I'm subscribed to (sidebar)
  @Get('mine')
  async getMySubscriptions(@Req() req: any) {
    return this.subscriptionsService.getMySubscriptions(req.user.userId);
  }

  // POST /subscriptions/:userId — subscribe to a user
  @Post(':userId')
  async subscribe(@Req() req: any, @Param('userId') userId: string) {
    return this.subscriptionsService.subscribe(req.user.userId, userId);
  }

  // DELETE /subscriptions/:userId — unsubscribe from a user
  @Delete(':userId')
  @HttpCode(200)
  async unsubscribe(@Req() req: any, @Param('userId') userId: string) {
    return this.subscriptionsService.unsubscribe(req.user.userId, userId);
  }

  // GET /subscriptions/check/:userId — am I subscribed to this user?
  @Get('check/:userId')
  async isSubscribed(@Req() req: any, @Param('userId') userId: string) {
    const result = await this.subscriptionsService.isSubscribed(
      req.user.userId,
      userId,
    );
    return { subscribed: result };
  }
}
