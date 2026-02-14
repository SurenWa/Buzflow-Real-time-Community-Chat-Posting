import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
    return socket;
}

export function connectSocket(userId: string): Socket {
    if (socket?.connected) {
        return socket;
    }

    // Disconnect old socket if exists
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    const token = getAccessToken();

    socket = io(SOCKET_URL, {
        // Send JWT in the handshake — server middleware verifies this
        auth: {
            token,
        },
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected (authenticated):', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.log('⚠️ Socket auth error:', err.message);

        // If token expired, we could try refreshing and reconnecting
        // For now, just log it — the auto-reconnect will retry
    });

    socket.on('reconnect_attempt', () => {
        // Update the token on reconnection attempts (it might have been refreshed)
        const freshToken = getAccessToken();
        if (socket && freshToken) {
            socket.auth = { token: freshToken };
        }
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