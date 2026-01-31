import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TelegramModule } from '../telegram/telegram.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { UsersModule } from '../users/users.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [forwardRef(() => TelegramModule), AnalysisModule, UsersModule, SnapshotsModule],
  providers: [TasksService, KeepAliveService],
  exports: [TasksService],
})
export class TasksModule {}
