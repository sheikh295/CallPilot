import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from './logger.service';
import { Log } from './log.entity';
import { RequestLoggingInterceptor } from '../../interceptors/request-logging.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [LoggerService, RequestLoggingInterceptor],
  exports: [LoggerService, RequestLoggingInterceptor],
})
export class LogsModule {}