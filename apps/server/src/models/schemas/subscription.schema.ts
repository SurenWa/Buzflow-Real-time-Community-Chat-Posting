import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  subscriberId: Types.ObjectId; // The user who subscribes

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  subscribedToId: Types.ObjectId; // The user being subscribed to
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Prevent duplicate subscriptions
SubscriptionSchema.index(
  { subscriberId: 1, subscribedToId: 1 },
  { unique: true },
);

// Fast lookup: "Who am I subscribed to?" (for sidebar)
SubscriptionSchema.index({ subscriberId: 1 });

// Fast lookup: "Who is subscribed to me?" (for sending notifications)
SubscriptionSchema.index({ subscribedToId: 1 });
