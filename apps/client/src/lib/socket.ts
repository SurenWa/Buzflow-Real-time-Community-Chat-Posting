import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
    return socket;
}

export function connectSocket(userId: string): Socket {
    // If already connected, return existing socket
    if (socket?.connected) {
        return socket;
    }

    // Create new connection
    socket = io(SOCKET_URL, {
        // Socket.IO connection options:
        transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
        withCredentials: true,                // Send cookies (for refresh token)
        autoConnect: true,
        reconnection: true,                   // Auto-reconnect if connection drops
        reconnectionAttempts: 10,             // Try 10 times before giving up
        reconnectionDelay: 1000,              // Wait 1s between attempts
        reconnectionDelayMax: 5000,           // Max 5s between attempts
    });

    // ─── Connection Lifecycle Events ───────────────
    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket?.id);

        // Tell the server who we are
        socket?.emit('register', { userId });
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        // Socket.IO will auto-reconnect unless we called socket.disconnect()
        // Common reasons:
        // - 'io server disconnect' → server forcefully disconnected us
        // - 'transport close' → connection lost (network issue)
        // - 'ping timeout' → server didn't respond to keepalive
    });

    socket.on('connect_error', (err) => {
        console.log('⚠️ Socket connection error:', err.message);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        // Re-register after reconnection
        socket?.emit('register', { userId });
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket manually disconnected');
    }
}