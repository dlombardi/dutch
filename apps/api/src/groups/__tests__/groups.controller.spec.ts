import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../../app.module';

interface Group {
  id: string;
  name: string;
  emoji: string;
  createdById: string;
  inviteCode: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateGroupResponse {
  group: Group;
}

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

// Valid UUID format that doesn't exist in the database
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('GroupsController (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testUserId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    httpServer = app.getHttpServer() as Server;

    // Create a guest user to get a valid UUID
    const guestResponse = await request(httpServer)
      .post('/auth/guest')
      .send({ deviceId: 'test-device-123', name: 'Test User' });
    testUserId = guestResponse.body.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /groups', () => {
    it('should create a group with name and emoji', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Trip to Paris',
          emoji: '🗼',
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body).toHaveProperty('group');
      expect(body.group).toMatchObject({
        name: 'Trip to Paris',
        emoji: '🗼',
        createdById: testUserId,
      });
      expect(body.group).toHaveProperty('id');
      expect(body.group).toHaveProperty('inviteCode');
      expect(body.group).toHaveProperty('defaultCurrency');
      expect(body.group.inviteCode.length).toBeGreaterThanOrEqual(6);
    });

    it('should create a group with default emoji if not provided', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Weekend Trip',
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.name).toBe('Weekend Trip');
      expect(body.group.emoji).toBe('👥'); // default emoji
    });

    it('should create a group with custom default currency', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Europe Trip',
          emoji: '🇪🇺',
          createdById: testUserId,
          defaultCurrency: 'EUR',
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.defaultCurrency).toBe('EUR');
    });

    it('should default currency to USD if not specified', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Local Group',
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.defaultCurrency).toBe('USD');
    });

    it('should reject empty name', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: '',
          createdById: testUserId,
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages.some((m) => m.includes('name'))).toBe(true);
    });

    it('should reject missing name', async () => {
      await request(httpServer)
        .post('/groups')
        .send({
          emoji: '🏖️',
          createdById: testUserId,
        })
        .expect(400);
    });

    it('should reject missing createdById', async () => {
      await request(httpServer)
        .post('/groups')
        .send({
          name: 'Test Group',
          emoji: '🏖️',
        })
        .expect(400);
    });

    it('should generate unique invite codes for different groups', async () => {
      const response1 = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Group 1',
          createdById: testUserId,
        })
        .expect(201);

      const response2 = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Group 2',
          createdById: testUserId,
        })
        .expect(201);

      const body1 = response1.body as CreateGroupResponse;
      const body2 = response2.body as CreateGroupResponse;

      expect(body1.group.inviteCode).not.toBe(body2.group.inviteCode);
    });

    it('should trim whitespace from group name', async () => {
      const response = await request(httpServer)
        .post('/groups')
        .send({
          name: '  Trimmed Group  ',
          createdById: testUserId,
        })
        .expect(201);

      const body = response.body as CreateGroupResponse;
      expect(body.group.name).toBe('Trimmed Group');
    });
  });

  describe('GET /groups/:id', () => {
    it('should retrieve a group by ID', async () => {
      // First create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Test Group',
          emoji: '🎉',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Then retrieve it
      const response = await request(httpServer)
        .get(`/groups/${createdGroup.id}`)
        .expect(200);

      const body = response.body as { group: Group };
      expect(body.group.id).toBe(createdGroup.id);
      expect(body.group.name).toBe('Test Group');
      expect(body.group.emoji).toBe('🎉');
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer).get(`/groups/${NON_EXISTENT_UUID}`).expect(404);
    });
  });

  describe('GET /groups/invite/:code', () => {
    it('should retrieve a group by invite code', async () => {
      // First create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Invite Test Group',
          emoji: '🎯',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Then retrieve it by invite code
      const response = await request(httpServer)
        .get(`/groups/invite/${createdGroup.inviteCode}`)
        .expect(200);

      const body = response.body as { group: Group };
      expect(body.group.id).toBe(createdGroup.id);
      expect(body.group.name).toBe('Invite Test Group');
      expect(body.group.emoji).toBe('🎯');
    });

    it('should return 404 for invalid invite code', async () => {
      await request(httpServer).get('/groups/invite/INVALID').expect(404);
    });
  });

  describe('POST /groups/join', () => {
    it('should add a member to a group by invite code', async () => {
      // Create a new user for joining
      const newMemberResponse = await request(httpServer)
        .post('/auth/guest')
        .send({ deviceId: 'new-member-device', name: 'New Member' });
      const newMemberId = newMemberResponse.body.user.id;

      // First create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Join Test Group',
          emoji: '🤝',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Join the group
      const joinResponse = await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: createdGroup.inviteCode,
          userId: newMemberId,
        })
        .expect(201);

      const body = joinResponse.body as {
        group: Group;
        membership: { userId: string; role: string };
      };
      expect(body.group.id).toBe(createdGroup.id);
      expect(body.membership.userId).toBe(newMemberId);
      expect(body.membership.role).toBe('member');
    });

    it('should return 404 for invalid invite code when joining', async () => {
      await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: 'INVALID',
          userId: testUserId,
        })
        .expect(404);
    });

    it('should reject missing invite code', async () => {
      await request(httpServer)
        .post('/groups/join')
        .send({
          userId: 'user-123',
        })
        .expect(400);
    });

    it('should reject missing user ID', async () => {
      await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: 'ABC123',
        })
        .expect(400);
    });

    it('should allow the same user to be added only once', async () => {
      // Create a user for duplicate test
      const duplicateUserResponse = await request(httpServer)
        .post('/auth/guest')
        .send({ deviceId: 'duplicate-user-device', name: 'Duplicate User' });
      const duplicateUserId = duplicateUserResponse.body.user.id;

      // First create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Duplicate Test Group',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Join the group first time
      await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: createdGroup.inviteCode,
          userId: duplicateUserId,
        })
        .expect(201);

      // Try to join again - should return existing membership
      const secondJoin = await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: createdGroup.inviteCode,
          userId: duplicateUserId,
        })
        .expect(200);

      const body = secondJoin.body as {
        group: Group;
        membership: { userId: string; role: string };
      };
      expect(body.membership.userId).toBe(duplicateUserId);
    });
  });

  describe('GET /groups/:id/members', () => {
    interface Member {
      userId: string;
      role: 'admin' | 'member';
      joinedAt: string;
    }

    interface MembersResponse {
      members: Member[];
    }

    it('should return list of members for a group', async () => {
      // Create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Members Test Group',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Get members - should include creator as admin
      const response = await request(httpServer)
        .get(`/groups/${createdGroup.id}/members`)
        .expect(200);

      const body = response.body as MembersResponse;
      expect(body.members).toHaveLength(1);
      expect(body.members[0].userId).toBe(testUserId);
      expect(body.members[0].role).toBe('admin');
      expect(body.members[0]).toHaveProperty('joinedAt');
    });

    it('should return all members including those who joined', async () => {
      // Create additional members
      const member1Response = await request(httpServer)
        .post('/auth/guest')
        .send({ deviceId: 'member-1-device', name: 'Member 1' });
      const member1Id = member1Response.body.user.id;

      const member2Response = await request(httpServer)
        .post('/auth/guest')
        .send({ deviceId: 'member-2-device', name: 'Member 2' });
      const member2Id = member2Response.body.user.id;

      // Create a group
      const createResponse = await request(httpServer)
        .post('/groups')
        .send({
          name: 'Multi Member Group',
          createdById: testUserId,
        })
        .expect(201);

      const createdGroup = (createResponse.body as CreateGroupResponse).group;

      // Add some members
      await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: createdGroup.inviteCode,
          userId: member1Id,
        })
        .expect(201);

      await request(httpServer)
        .post('/groups/join')
        .send({
          inviteCode: createdGroup.inviteCode,
          userId: member2Id,
        })
        .expect(201);

      // Get members
      const response = await request(httpServer)
        .get(`/groups/${createdGroup.id}/members`)
        .expect(200);

      const body = response.body as MembersResponse;
      expect(body.members).toHaveLength(3);

      // Creator should be admin
      const creator = body.members.find((m) => m.userId === testUserId);
      expect(creator?.role).toBe('admin');

      // Others should be members
      const member1 = body.members.find((m) => m.userId === member1Id);
      const member2 = body.members.find((m) => m.userId === member2Id);
      expect(member1?.role).toBe('member');
      expect(member2?.role).toBe('member');
    });

    it('should return 404 for non-existent group', async () => {
      await request(httpServer)
        .get(`/groups/${NON_EXISTENT_UUID}/members`)
        .expect(404);
    });
  });
});
