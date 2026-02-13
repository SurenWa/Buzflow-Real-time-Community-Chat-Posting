import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';

/**
 * WebSocket Gateway for real-time chat.
 *
 * CONNECTION LIFECYCLE:
 * 1. Client connects → handleConnection() fires
 * 2. Client sends 'register' event with their userId → we join them to a room
 * 3. Client sends 'sendMessage' → we save to DB + emit to recipient
 * 4. Client disconnects → handleDisconnect() fires
 *
 * ROOMS STRATEGY:
 * - Each user gets a room named `user:{userId}`
 * - To send a message TO someone, emit to their room
 * - If user has multiple tabs open, all tabs are in the same room = all receive the message
 */
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track which userId is associated with which socket(s)
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private messagesService: MessagesService) {}

  // ─── Connection Lifecycle ────────────────────────
  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    // At this point we don't know WHO connected yet.
    // The client must send a 'register' event with their userId.
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);

    // Remove this socket from our tracking
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          console.log(`👤 User ${userId} fully offline (no sockets left)`);
        }
        break;
      }
    }
  }

  // ─── Register: Client tells us who they are ──────
  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    if (!userId) return;

    // Join the user's personal room
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    client.join(`user:${userId}`);

    // Track the socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    console.log(`✅ User ${userId} registered (socket: ${client.id})`);

    // Acknowledge success back to the client
    return { event: 'registered', data: { success: true } };
  }

  // ─── Send Message ────────────────────────────────
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { receiverId: string; content: string; senderId: string },
  ) {
    const { senderId, receiverId, content } = data;

    if (!senderId || !receiverId || !content?.trim()) {
      return { event: 'error', data: { message: 'Invalid message data' } };
    }

    // 1) Save to database
    const message = await this.messagesService.createMessage(
      senderId,
      receiverId,
      content.trim(),
    );

    // Build the message object to send to clients
    const messagePayload = {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      createdAt: message.createdAt,
    };

    // 2) Emit to the RECEIVER's room
    //    If Bob has 3 tabs open, all 3 get this event
    this.server.to(`user:${receiverId}`).emit('newMessage', messagePayload);

    // 3) Also emit back to the SENDER's room (for multi-tab sync)
    //    This ensures if Alice has 2 tabs, both tabs see the sent message
    this.server.to(`user:${senderId}`).emit('newMessage', messagePayload);

    console.log(
      `💬 Message: ${senderId} → ${receiverId}: "${content.substring(0, 30)}..."`,
    );

    // 4) Acknowledge to the sender
    return { event: 'messageSent', data: messagePayload };
  }

  // ─── Typing Indicators (bonus) ──────────────────
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { senderId: string; receiverId: string; isTyping: boolean },
  ) {
    // Forward typing status to the receiver
    this.server.to(`user:${data.receiverId}`).emit('userTyping', {
      userId: data.senderId,
      isTyping: data.isTyping,
    });
  }

  // ─── Helper: Emit to a specific user ─────────────
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
