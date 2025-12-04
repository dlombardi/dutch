import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('SyncGateway', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  let accessToken: string;
  let testUserId: string;
  const PORT = 3002;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(PORT);

    // Create a guest user to get a valid JWT token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/guest')
      .send({ deviceId: 'ws-test-device', name: 'WS Test User' });
    accessToken = authResponse.body.accessToken;
    testUserId = authResponse.body.user.id;
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await app.close();
  });

  afterEach(() => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
  });

  const connectClient = (): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const socket = io(`http://localhost:${PORT}`, {
        transports: ['websocket'],
        forceNew: true,
        auth: { token: accessToken },
      });

      // Wait for 'welcome' event instead of 'connect' because
      // the server's async handleConnection() sets client.user AFTER
      // the connect event. The welcome event is emitted after client.user is set.
      socket.on('welcome', () => {
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });
  };

  describe('connection', () => {
    it('should allow client to connect', async () => {
      clientSocket = await connectClient();
      expect(clientSocket.connected).toBe(true);
    });

    it('should receive welcome message on connect', async () => {
      const welcomePromise = new Promise<any>((resolve) => {
        clientSocket = io(`http://localhost:${PORT}`, {
          transports: ['websocket'],
          forceNew: true,
          auth: { token: accessToken },
        });
        clientSocket.on('welcome', (data) => {
          resolve(data);
        });
      });

      const data = await welcomePromise;
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Connected');
    });

    it('should receive socket id on connect', async () => {
      const welcomePromise = new Promise<any>((resolve) => {
        clientSocket = io(`http://localhost:${PORT}`, {
          transports: ['websocket'],
          forceNew: true,
          auth: { token: accessToken },
        });
        clientSocket.on('welcome', (data) => {
          resolve(data);
        });
      });

      const data = await welcomePromise;
      expect(data).toHaveProperty('socketId');
      expect(typeof data.socketId).toBe('string');
    });
  });

  describe('group subscription', () => {
    it('should allow client to join a group room', async () => {
      // Create a group for testing
      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Test Group',
          createdById: testUserId,
        });
      const groupId = groupResponse.body.group.id;

      clientSocket = await connectClient();

      const response = await new Promise<any>((resolve) => {
        clientSocket.emit(
          'joinGroup',
          { groupId },
          (response: any) => {
            resolve(response);
          },
        );
      });

      expect(response.success).toBe(true);
      expect(response.groupId).toBe(groupId);
    });

    it('should allow client to leave a group room', async () => {
      // Create a group for testing
      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Leave Test Group',
          createdById: testUserId,
        });
      const groupId = groupResponse.body.group.id;

      clientSocket = await connectClient();

      // First join
      await new Promise<void>((resolve) => {
        clientSocket.emit('joinGroup', { groupId }, () => {
          resolve();
        });
      });

      // Then leave
      const response = await new Promise<any>((resolve) => {
        clientSocket.emit(
          'leaveGroup',
          { groupId },
          (response: any) => {
            resolve(response);
          },
        );
      });

      expect(response.success).toBe(true);
      expect(response.groupId).toBe(groupId);
    });

    it('should allow client to join multiple groups', async () => {
      // Create groups for testing
      const group1Response = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Multi Group 1',
          createdById: testUserId,
        });
      const group1Id = group1Response.body.group.id;

      const group2Response = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Multi Group 2',
          createdById: testUserId,
        });
      const group2Id = group2Response.body.group.id;

      clientSocket = await connectClient();

      const response1 = await new Promise<any>((resolve) => {
        clientSocket.emit(
          'joinGroup',
          { groupId: group1Id },
          (response: any) => {
            resolve(response);
          },
        );
      });

      const response2 = await new Promise<any>((resolve) => {
        clientSocket.emit(
          'joinGroup',
          { groupId: group2Id },
          (response: any) => {
            resolve(response);
          },
        );
      });

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);
    });
  });

  describe('ping/pong', () => {
    it('should respond to ping with pong', async () => {
      clientSocket = await connectClient();

      const response = await new Promise<any>((resolve) => {
        clientSocket.emit('ping', {}, (response: any) => {
          resolve(response);
        });
      });

      expect(response).toBe('pong');
    });
  });

  describe('broadcasting', () => {
    it('should receive expense:created event when broadcast to group', async () => {
      // Create a group for testing
      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Broadcast Test Group',
          createdById: testUserId,
        });
      const groupId = groupResponse.body.group.id;

      // Connect two clients
      clientSocket = await connectClient();
      const client2 = await connectClient();

      // Both join the same group
      await new Promise<void>((resolve) => {
        clientSocket.emit(
          'joinGroup',
          { groupId },
          () => {
            resolve();
          },
        );
      });

      await new Promise<void>((resolve) => {
        client2.emit('joinGroup', { groupId }, () => {
          resolve();
        });
      });

      // Set up listener on client2
      const eventPromise = new Promise<any>((resolve) => {
        client2.on('expense:created', (data) => {
          resolve(data);
        });
      });

      // Emit test broadcast event from client1
      clientSocket.emit('testBroadcast', {
        groupId,
        event: 'expense:created',
        data: { expenseId: 'test-expense-123', amount: 50 },
      });

      const receivedData = await eventPromise;
      expect(receivedData).toHaveProperty('expenseId', 'test-expense-123');
      expect(receivedData).toHaveProperty('amount', 50);

      client2.disconnect();
    });

    it('should not receive events from groups not joined', async () => {
      // Create two groups for testing
      const groupAResponse = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Group A',
          createdById: testUserId,
        });
      const groupAId = groupAResponse.body.group.id;

      const groupBResponse = await request(app.getHttpServer())
        .post('/groups')
        .send({
          name: 'WS Group B',
          createdById: testUserId,
        });
      const groupBId = groupBResponse.body.group.id;

      clientSocket = await connectClient();
      const client2 = await connectClient();

      // Client1 joins group-a, client2 joins group-b
      await new Promise<void>((resolve) => {
        clientSocket.emit('joinGroup', { groupId: groupAId }, () => {
          resolve();
        });
      });

      await new Promise<void>((resolve) => {
        client2.emit('joinGroup', { groupId: groupBId }, () => {
          resolve();
        });
      });

      // Set up listener on client2
      let receivedEvent = false;
      client2.on('expense:created', () => {
        receivedEvent = true;
      });

      // Emit broadcast to group-a (client2 is not in group-a)
      clientSocket.emit('testBroadcast', {
        groupId: groupAId,
        event: 'expense:created',
        data: { expenseId: 'test-expense-456' },
      });

      // Wait a bit to see if event is received
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedEvent).toBe(false);

      client2.disconnect();
    });
  });
});
