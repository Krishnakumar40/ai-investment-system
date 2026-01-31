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
        let dbUrl = configService.get<string>('DATABASE_URL');
        
        if (dbUrl) {
          // Clean the URL: remove spaces, quotes, and ensure correct prefix
          dbUrl = dbUrl.trim().replace(/^['"]|['"]$/g, '');
          if (dbUrl.startsWith('postgres://')) {
            dbUrl = dbUrl.replace('postgres://', 'postgresql://');
          }

          // Fix special characters in password (like #) which break URL parsing
          // Matches: protocol://user:password@host/db
          const urlMatch = dbUrl.match(/^(postgresql?:\/\/)([^:]+):(.+)@(.+)$/);
          if (urlMatch) {
            const protocol = urlMatch[1];
            const user = urlMatch[2];
            const passwordWithHost = urlMatch[3]; // This might contain the @ host part
            const lastAtIndex = passwordWithHost.lastIndexOf('@');
            
            if (lastAtIndex !== -1) {
              const password = passwordWithHost.substring(0, lastAtIndex);
              const hostAndDb = passwordWithHost.substring(lastAtIndex + 1);
              // Encode only the password to handle chars like # or @
              dbUrl = `${protocol}${user}:${encodeURIComponent(password)}@${hostAndDb}`;
            }
          }

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
