import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, default: null })
  refreshToken: string | null;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ type: Date, default: null })
  lastSeen: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for login lookups
//UserSchema.index({ email: 1 });
