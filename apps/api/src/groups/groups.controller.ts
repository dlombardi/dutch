import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(
      dto.name,
      dto.createdById,
      dto.emoji,
      dto.defaultCurrency,
    );
  }

  @Get(':id')
  getGroup(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }
}
