import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { TelegramService } from './telegram.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [ConfigModule, UsersModule, forwardRef(() => TasksModule)],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
