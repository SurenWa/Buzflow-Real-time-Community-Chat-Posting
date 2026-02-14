import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { SocketProvider } from '@/context/socket-context';
import { ToastProvider } from '@/context/toast-context';

export const metadata: Metadata = {
    title: 'Buzzline',
    description: 'Social + Chat + Notifications',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body suppressHydrationWarning>
                <AuthProvider>
                    <SocketProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}