/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { createSocketAuthMiddleware } from './chat-auth.middleware';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // userId → Set of socketIds
  // Tracks all active sockets per user (handles multiple tabs)
  private userSockets: Map<string, Set<string>> = new Map();

  // userId → timeout handle for disconnect grace period
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── Init: Attach auth middleware ────────────────
  afterInit(server: Server) {
    const middleware = createSocketAuthMiddleware(
      this.jwtService,
      this.configService,
    );
    server.use(middleware);
    console.log('🔐 Socket.IO auth middleware attached');
  }

  // ─── Connection: Auto-register + go online ───────
  async handleConnection(client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      console.log(
        `❌ Socket ${client.id} connected without userId — disconnecting`,
      );
      client.disconnect();
      return;
    }

    // Cancel any pending "go offline" timer for this user
    // (handles page refresh: disconnect → immediate reconnect)
    const existingTimer = this.disconnectTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.disconnectTimers.delete(userId);
    }

    // Join the user's personal room
    client.join(`user:${userId}`);

    // Track the socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const wasOffline = this.userSockets.get(userId)!.size === 0;
    this.userSockets.get(userId)!.add(client.id);

    console.log(
      `🔌 User ${userId} connected (socket: ${client.id}, total: ${this.userSockets.get(userId)!.size})`,
    );

    // If user was offline → mark online + notify subscribers
    if (wasOffline) {
      await this.goOnline(userId);
    }
  }

  // ─── Disconnect: Grace period → go offline ───────
  // eslint-disable-next-line @typescript-eslint/require-await
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    // Remove this socket from tracking
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);

      console.log(
        `❌ User ${userId} socket disconnected (${client.id}, remaining: ${sockets.size})`,
      );

      // If no more sockets → start grace period
      if (sockets.size === 0) {
        this.userSockets.delete(userId);

        // Wait 2 seconds before marking offline
        // If user reconnects within 2s (page refresh), we cancel this timer
        const timer = setTimeout(async () => {
          this.disconnectTimers.delete(userId);

          // Double-check they haven't reconnected
          if (
            !this.userSockets.has(userId) ||
            this.userSockets.get(userId)!.size === 0
          ) {
            await this.goOffline(userId);
          }
        }, 2000);

        this.disconnectTimers.set(userId, timer);
      }
    }
  }

  // ─── Go Online: Update DB + Notify Subscribers ───
  private async goOnline(userId: string) {
    // Update DB
    await this.usersService.setOnlineStatus(userId, true);

    // Find who is subscribed TO this user (they need to see the green dot)
    const subscriberIds =
      await this.subscriptionsService.getSubscribers(userId);

    // Emit to each subscriber's room
    for (const subscriberId of subscriberIds) {
      this.server.to(`user:${subscriberId}`).emit('presenceUpdate', {
        userId,
        isOnline: true,
      });
    }

    console.log(
      `🟢 User ${userId} is ONLINE → notified ${subscriberIds.length} subscribers`,
    );
  }

  // ─── Go Offline: Update DB + Notify Subscribers ──
  private async goOffline(userId: string) {
    await this.usersService.setOnlineStatus(userId, false);

    const subscriberIds =
      await this.subscriptionsService.getSubscribers(userId);

    for (const subscriberId of subscriberIds) {
      this.server.to(`user:${subscriberId}`).emit('presenceUpdate', {
        userId,
        isOnline: false,
      });
    }

    console.log(
      `⚫ User ${userId} is OFFLINE → notified ${subscriberIds.length} subscribers`,
    );
  }

  // ─── Send Message ────────────────────────────────
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    // userId comes from JWT (verified in middleware) — NOT from client data
    const senderId = client.data.userId;

    if (!senderId || !data.receiverId || !data.content?.trim()) {
      return { event: 'error', data: { message: 'Invalid message data' } };
    }

    // Save to database
    const message = await this.messagesService.createMessage(
      senderId,
      data.receiverId,
      data.content.trim(),
    );

    const messagePayload = {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      createdAt: message.createdAt,
    };

    // Emit to receiver and sender rooms
    this.server
      .to(`user:${data.receiverId}`)
      .emit('newMessage', messagePayload);
    this.server.to(`user:${senderId}`).emit('newMessage', messagePayload);

    console.log(
      `💬 ${senderId} → ${data.receiverId}: "${data.content.substring(0, 30)}..."`,
    );

    return { event: 'messageSent', data: messagePayload };
  }

  // ─── Typing Indicators ──────────────────────────
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const senderId = client.data.userId;
    this.server.to(`user:${data.receiverId}`).emit('userTyping', {
      userId: senderId,
      isTyping: data.isTyping,
    });
  }

  // ─── Helper: Emit to a specific user ─────────────
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // ─── Helper: Check if user is online (in memory) ──
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}
