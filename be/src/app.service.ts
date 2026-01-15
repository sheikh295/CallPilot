import { Injectable } from '@nestjs/common';
import { LoggerService } from './services/logger/logger.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: LoggerService) {}

  getHello(): string {
    this.logger.info('Hello endpoint called', {
      endpoint: 'getHello',
      timestamp: new Date().toISOString(),
    });
    return 'Hello World!';
  }
}
