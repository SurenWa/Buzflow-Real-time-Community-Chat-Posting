import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId; // Who receives this notification

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: Types.ObjectId; // Who triggered it

  @Prop({ type: Types.ObjectId, ref: 'Post', default: null })
  postId: Types.ObjectId | null; // The related post (if any)

  @Prop({ required: true, enum: ['new_post'] })
  type: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// "My notifications, newest first"
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Unread count query
NotificationSchema.index({ recipientId: 1, read: 1 });
