'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuth } from './auth-context';

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            disconnectSocket();
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const s = connectSocket(user._id);
        setSocket(s);

        const onConnect = () => {
            setIsConnected(true);
        };

        const onDisconnect = () => {
            setIsConnected(false);
        };

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);

        // If already connected (reconnect scenario)
        if (s.connected) {
            setIsConnected(true);
        }

        return () => {
            s.off('connect', onConnect);
            s.off('disconnect', onDisconnect);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}