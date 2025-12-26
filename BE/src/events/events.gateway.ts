import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('EventsGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-workflow')
    handleJoinWorkflow(
        @MessageBody() data: { workflowId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`workflow:${data.workflowId}`);
        this.logger.log(`Client ${client.id} joined workflow:${data.workflowId}`);
        return { event: 'joined', workflowId: data.workflowId };
    }

    @SubscribeMessage('leave-workflow')
    handleLeaveWorkflow(
        @MessageBody() data: { workflowId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`workflow:${data.workflowId}`);
        this.logger.log(`Client ${client.id} left workflow:${data.workflowId}`);
    }

    @SubscribeMessage('cursor-move')
    handleCursorMove(
        @MessageBody() data: { workflowId: string, cursor: { x: number, y: number, userId: string, userName?: string } },
        @ConnectedSocket() client: Socket,
    ) {
        // Broadcast to everyone in the room EXCEPT the sender
        client.to(`workflow:${data.workflowId}`).emit('cursor-update', data.cursor);
    }
}
