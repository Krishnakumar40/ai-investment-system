import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { DecisionsModule } from './decisions/decisions.module';
import { AlertsModule } from './alerts/alerts.module';
import { TasksModule } from './tasks/tasks.module';
import { TelegramModule } from './telegram/telegram.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'better-sqlite3',
          database: 'investment.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    PortfoliosModule,
    SnapshotsModule,
    DecisionsModule,
    AlertsModule,
    TasksModule,
    TelegramModule,
    AnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
