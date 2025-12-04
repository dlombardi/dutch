import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersRepository } from '../db/repositories';
import type { JwtPayload } from './jwt.strategy';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email?: string;
    name: string;
    type: 'guest' | 'claimed' | 'full';
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepo: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    // Try to get token from handshake auth or query
    const auth = client.handshake?.auth as { token?: string } | undefined;
    const token =
      auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '') ||
      (client.handshake?.query?.token as string);

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.usersRepo.findById(payload.sub);

      if (!user) {
        throw new WsException('User not found');
      }

      // Attach user to socket for use in handlers
      client.user = {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name,
        type: user.type,
      };

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Invalid authentication token');
    }
  }
}
