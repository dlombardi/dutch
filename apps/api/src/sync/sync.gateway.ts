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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track which groups each socket is in
  private socketGroups: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
    this.socketGroups.set(client.id, new Set());

    // Send welcome message
    client.emit('welcome', {
      message: 'Connected to Evn sync server',
      socketId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
    this.socketGroups.delete(client.id);
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    client.join(groupId);

    // Track group membership
    const groups = this.socketGroups.get(client.id);
    if (groups) {
      groups.add(groupId);
    }

    console.log(`[WS] Client ${client.id} joined group ${groupId}`);

    return { success: true, groupId };
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    client.leave(groupId);

    // Remove from tracking
    const groups = this.socketGroups.get(client.id);
    if (groups) {
      groups.delete(groupId);
    }

    console.log(`[WS] Client ${client.id} left group ${groupId}`);

    return { success: true, groupId };
  }

  @SubscribeMessage('ping')
  handlePing() {
    return 'pong';
  }

  @SubscribeMessage('testBroadcast')
  handleTestBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; event: string; data: any },
  ) {
    // Broadcast to the group (excluding sender)
    client.to(data.groupId).emit(data.event, data.data);
    return { success: true };
  }

  // Public method to broadcast events from other services
  broadcastToGroup(groupId: string, event: string, data: any) {
    this.server.to(groupId).emit(event, data);
  }

  // Get all sockets in a group
  getGroupMembers(groupId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(groupId);
    return room ? Array.from(room) : [];
  }
}
