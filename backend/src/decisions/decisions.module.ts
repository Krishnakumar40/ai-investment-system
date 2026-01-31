import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { Decision } from './decision.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Decision])],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
