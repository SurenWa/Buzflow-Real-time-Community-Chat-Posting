import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../models/schemas';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getConversation(userA: string, userB: string, limit = 50) {
    return this.messageModel
      .find({
        $or: [
          {
            senderId: new Types.ObjectId(userA),
            receiverId: new Types.ObjectId(userB),
          },
          {
            senderId: new Types.ObjectId(userB),
            receiverId: new Types.ObjectId(userA),
          },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  async createMessage(senderId: string, receiverId: string, content: string) {
    return this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      content,
    });
  }
}
