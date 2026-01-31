import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';
import { Snapshot } from './snapshot.entity';
import { PortfolioValue } from './portfolio-value.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Snapshot, PortfolioValue])],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
