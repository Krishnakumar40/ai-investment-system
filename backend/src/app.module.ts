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

          // Build robust URL even if it has special characters
          try {
            const [protocolPart, rest] = dbUrl.split('://');
            const protocol = protocolPart + '://';
            
            // Split at the LAST @ to safely separate password from host
            const lastAtIndex = rest.lastIndexOf('@');
            if (lastAtIndex !== -1) {
              const authPart = rest.substring(0, lastAtIndex);
              const hostAndDb = rest.substring(lastAtIndex + 1);
              
              // Split user and password at the FIRST : in the auth part
              const firstColonIndex = authPart.indexOf(':');
              if (firstColonIndex !== -1) {
                const user = authPart.substring(0, firstColonIndex);
                const password = authPart.substring(firstColonIndex + 1);
                
                // Re-encode everything cleanly
                dbUrl = `${protocol}${user}:${encodeURIComponent(password)}@${hostAndDb}`;
              }
            }
          } catch (e) {
            // Fallback to original if parsing fails
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
