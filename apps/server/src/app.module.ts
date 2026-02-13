import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
  Subscription,
  SubscriptionSchema,
  Message,
  MessageSchema,
  Post,
  PostSchema,
  Notification,
  NotificationSchema,
} from './models/schemas';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ChatModule } from './chat/chat.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Post.name, schema: PostSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PostsModule,
    NotificationsModule,
    ChatModule,
    MessagesModule,
  ],
})
export class AppModule {}
