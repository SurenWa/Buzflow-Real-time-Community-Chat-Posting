/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Socket.IO middleware that verifies JWT before allowing connection.
 *
 * The client sends the access token in the handshake:
 *   io(URL, { auth: { token: 'eyJ...' } })
 *
 * This middleware runs BEFORE handleConnection().
 * If the token is invalid, the connection is rejected with an error.
 * If valid, we attach userId to socket.data for use in the gateway.
 */
export function createSocketAuthMiddleware(
  jwtService: JwtService,
  configService: ConfigService,
) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = await jwtService.verifyAsync(token, {
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // Attach user data to socket for use in gateway handlers
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;

      next(); // Allow connection
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  };
}
