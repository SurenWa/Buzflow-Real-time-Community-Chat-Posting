/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('messages')
@UseGuards(AccessTokenGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // GET /messages/:userId — get conversation with a specific user
  @Get(':userId')
  async getConversation(@Req() req: any, @Param('userId') userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.messagesService.getConversation(req.user.userId, userId);
  }
}
