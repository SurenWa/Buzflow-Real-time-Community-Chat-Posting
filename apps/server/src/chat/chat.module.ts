import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    MessagesModule,
    UsersModule,
    SubscriptionsModule,
    JwtModule.register({}),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
