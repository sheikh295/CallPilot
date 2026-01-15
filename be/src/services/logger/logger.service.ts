import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as winston from 'winston';
import { Log, LogLevel, LogType } from './log.entity';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  stack?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private readonly winstonLogger: winston.Logger;

  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {
    // Configure Winston logger for console output
    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  // Request logging - saves to DB and prints to console
  async logRequest(context: LogContext & { message: string; level?: LogLevel }) {
    const { message, level = LogLevel.INFO, ...logContext } = context;

    // Print to console
    this.winstonLogger.log(level, message, {
      type: 'request',
      ...logContext,
    });

    // Save to database
    try {
      await this.logRepository.save({
        level,
        type: LogType.REQUEST,
        message,
        context: logContext,
        userId: logContext.userId,
        sessionId: logContext.sessionId,
        ipAddress: logContext.ipAddress,
        userAgent: logContext.userAgent,
        method: logContext.method,
        url: logContext.url,
        statusCode: logContext.statusCode,
        responseTime: logContext.responseTime,
      });
    } catch (error) {
      this.winstonLogger.error('Failed to save request log to database', {
        error: error.message,
        originalMessage: message,
      });
    }
  }

  // Application logging - only saves to DB, no console output
  async info(message: string, context?: LogContext) {
    await this.saveApplicationLog(LogLevel.INFO, message, context);
  }

  async warn(message: string, context?: LogContext) {
    await this.saveApplicationLog(LogLevel.WARN, message, context);
  }

  async error(message: string, context?: LogContext) {
    await this.saveApplicationLog(LogLevel.ERROR, message, context);
  }

  async debug(message: string, context?: LogContext) {
    await this.saveApplicationLog(LogLevel.DEBUG, message, context);
  }

  async verbose(message: string, context?: LogContext) {
    await this.saveApplicationLog(LogLevel.VERBOSE, message, context);
  }

  private async saveApplicationLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    try {
      await this.logRepository.save({
        level,
        type: LogType.APPLICATION,
        message,
        context,
        userId: context?.userId,
        sessionId: context?.sessionId,
        stack: context?.stack,
      });
    } catch (error) {
      // If database logging fails, we still want to log the error
      // But since this is application logging, we'll use winston to log the failure
      this.winstonLogger.error('Failed to save application log to database', {
        error: error.message,
        originalMessage: message,
        level,
      });
    }
  }

  // Legacy methods for backward compatibility
  logToConsole(message: string, context?: string) {
    this.winstonLogger.info(message, { context });
  }

  warnToConsole(message: string, context?: string) {
    this.winstonLogger.warn(message, { context });
  }

  errorToConsole(message: string, trace?: string, context?: string) {
    this.winstonLogger.error(message, { trace, context });
  }

  debugToConsole(message: string, context?: string) {
    this.winstonLogger.debug(message, { context });
  }

  verboseToConsole(message: string, context?: string) {
    this.winstonLogger.verbose(message, { context });
  }
}