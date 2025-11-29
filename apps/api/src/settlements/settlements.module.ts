import { Module, forwardRef } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { GroupsModule } from '../groups/groups.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [forwardRef(() => GroupsModule), SyncModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
