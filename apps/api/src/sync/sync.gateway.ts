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
import { JwtService } from '@nestjs/jwt';
import { UsersRepository, GroupsRepository } from '../db/repositories';
import type { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email?: string;
    name: string;
    type: 'guest' | 'claimed' | 'full';
  };
}

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

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepo: UsersRepository,
    private readonly groupsRepo: GroupsRepository,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Get token from handshake auth, authorization header, or query
      const auth = client.handshake?.auth as { token?: string } | undefined;
      const token =
        auth?.token ||
        client.handshake?.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake?.query?.token as string);

      if (!token) {
        console.log(
          `[WS] Client ${client.id} rejected: No authentication token`,
        );
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.usersRepo.findById(payload.sub);

      if (!user) {
        console.log(`[WS] Client ${client.id} rejected: User not found`);
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      // Attach user to socket
      client.user = {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name,
        type: user.type,
      };

      this.socketGroups.set(client.id, new Set());

      console.log(`[WS] Client connected: ${client.id} (user: ${user.id})`);

      // Send welcome message
      client.emit('welcome', {
        message: 'Connected to Evn sync server',
        socketId: client.id,
        userId: user.id,
      });
    } catch {
      console.log(`[WS] Client ${client.id} rejected: Invalid token`);
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
    this.socketGroups.delete(client.id);
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;

    // Verify user is authenticated
    if (!client.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify user is a member of the group
    const member = await this.groupsRepo.findMember(groupId, client.user.id);
    if (!member) {
      console.log(`[WS] Client ${client.id} denied access to group ${groupId}`);
      return { success: false, error: 'Not a member of this group' };
    }

    void client.join(groupId);

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
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;

    if (!client.user) {
      return { success: false, error: 'Not authenticated' };
    }

    void client.leave(groupId);

    // Remove from tracking
    const groups = this.socketGroups.get(client.id);
    if (groups) {
      groups.delete(groupId);
    }

    console.log(`[WS] Client ${client.id} left group ${groupId}`);

    return { success: true, groupId };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) {
      return { error: 'Not authenticated' };
    }
    return 'pong';
  }

  // Test helper to broadcast events from a client (used in integration tests)
  @SubscribeMessage('testBroadcast')
  handleTestBroadcast(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string; event: string; data: unknown },
  ) {
    if (!client.user) {
      return { error: 'Not authenticated' };
    }
    this.broadcastToGroup(data.groupId, data.event, data.data);
    return { success: true };
  }

  // Public method to broadcast events from other services
  broadcastToGroup(groupId: string, event: string, data: unknown) {
    this.server.to(groupId).emit(event, data);
  }

  // Get all sockets in a group
  getGroupMembers(groupId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(groupId);
    return room ? Array.from(room) : [];
  }
}
