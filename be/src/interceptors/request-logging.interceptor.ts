import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger/logger.service';
import { LogLevel } from '../services/logger/log.entity';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id; // Assuming user is attached by auth middleware
    const sessionId = request.session?.id || headers['x-session-id'];

    return next.handle().pipe(
      tap(async (data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        await this.logger.logRequest({
          message: `${method} ${url} ${statusCode} - ${responseTime}ms`,
          level: statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
          method,
          url,
          statusCode,
          responseTime,
          ipAddress: ip,
          userAgent,
          userId,
          sessionId,
        });
      }),
    );
  }
}