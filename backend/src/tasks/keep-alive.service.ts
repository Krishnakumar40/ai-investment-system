import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private configService: ConfigService) {}

  // Ping every 10 minutes during market hours (9 AM - 4 PM IST)
  @Cron('0 */10 9-16 * * *', { name: 'keep_awake', timeZone: 'Asia/Kolkata' })
  async handleKeepAwake() {
    const appUrl = this.configService.get<string>('RENDER_URL');
    if (!appUrl) return;

    try {
      this.logger.log(`Pinging ${appUrl} to stay awake...`);
      await axios.get(appUrl);
      this.logger.log('Ping successful.');
    } catch (e) {
      this.logger.warn(`Keep-awake ping failed: ${e.message}`);
    }
  }
}
