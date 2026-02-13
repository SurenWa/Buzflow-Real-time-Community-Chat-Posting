import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Feed: latest posts first
PostSchema.index({ createdAt: -1 });

// Posts by a specific user
PostSchema.index({ authorId: 1, createdAt: -1 });
