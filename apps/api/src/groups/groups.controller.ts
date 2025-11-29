import { Controller, Post, Get, Body, Param, Res, Inject, forwardRef } from '@nestjs/common';
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
    @Inject(forwardRef(() => SettlementsService))
    private readonly settlementsService: SettlementsService,
  ) {}

  @Post()
  createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(
      dto.name,
      dto.createdById,
      dto.emoji,
      dto.defaultCurrency,
    );
  }

  @Get('invite/:code')
  getGroupByInviteCode(@Param('code') code: string) {
    return this.groupsService.getGroupByInviteCode(code);
  }

  @Post('join')
  joinGroup(@Body() dto: JoinGroupDto, @Res() res: Response) {
    const result = this.groupsService.joinGroup(dto.inviteCode, dto.userId);
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
  getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembersById(id);
  }

  @Get(':id/balances')
  getGroupBalances(@Param('id') id: string) {
    return this.balancesService.getGroupBalances(id);
  }

  @Get(':id/settlements')
  getGroupSettlements(@Param('id') id: string) {
    return this.settlementsService.getSettlementsByGroupId(id);
  }

  @Get(':id')
  getGroup(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }
}
