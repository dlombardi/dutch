import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { SettlementsService } from '../settlements/settlements.service';
import { CreateGroupDto, JoinGroupDto } from './dto';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly balancesService: BalancesService,
    private readonly settlementsService: SettlementsService,
  ) {}

  @Post()
  async createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(
      dto.name,
      dto.createdById,
      dto.emoji,
      dto.defaultCurrency,
    );
  }

  @Get('invite/:code')
  async getGroupByInviteCode(@Param('code') code: string) {
    return this.groupsService.getGroupByInviteCode(code);
  }

  @Post('join')
  async joinGroup(@Body() dto: JoinGroupDto, @Res() res: Response) {
    const result = await this.groupsService.joinGroup(
      dto.inviteCode,
      dto.userId,
    );
    const response = {
      group: result.group,
      membership: {
        userId: result.membership.userId,
        role: result.membership.role,
        joinedAt: result.membership.joinedAt,
      },
    };
    // Return 200 if already a member, 201 if new member
    return res.status(result.isNewMember ? 201 : 200).json(response);
  }

  @Get(':id/members')
  async getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembersById(id);
  }

  @Get(':id/balances')
  async getGroupBalances(@Param('id') id: string) {
    return this.balancesService.getGroupBalances(id);
  }

  @Get(':id/settlements')
  async getGroupSettlements(@Param('id') id: string) {
    return this.settlementsService.getSettlementsByGroupId(id);
  }

  @Get(':id')
  async getGroup(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }
}
