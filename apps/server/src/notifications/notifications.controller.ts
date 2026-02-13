/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    return this.notificationsService.getMyNotifications(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId,
    );
    return { count };
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(id, req.user.userId);
  }
}
