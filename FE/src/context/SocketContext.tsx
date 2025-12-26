import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000/events'; // Namespace

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinWorkflow: (workflowId: string) => void;
    leaveWorkflow: (workflowId: string) => void;
    emitCursor: (workflowId: string, cursor: { x: number, y: number, userId: string, userName?: string }) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    joinWorkflow: () => {},
    leaveWorkflow: () => {},
    emitCursor: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
           console.log('Socket connected:', socket.id);
           setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
        
        return () => {
            socket.disconnect();
        };
    }, []);

    const joinWorkflow = (workflowId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join-workflow', { workflowId });
        }
    };

    const leaveWorkflow = (workflowId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leave-workflow', { workflowId });
        }
    };

    const emitCursor = (workflowId: string, cursor: { x: number, y: number, userId: string, userName?: string }) => {
        if (socketRef.current?.connected) {
            // Rate limit done by caller or here if needed, but for now direct emit
             socketRef.current.emit('cursor-move', { workflowId, cursor });
        }
    };

    return (
        <SocketContext.Provider value={{ 
            socket: socketRef.current, 
            isConnected,
            joinWorkflow,
            leaveWorkflow,
            emitCursor
        }}>
            {children}
        </SocketContext.Provider>
    );
};
