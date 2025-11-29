import { Module, forwardRef } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [forwardRef(() => GroupsModule)],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
