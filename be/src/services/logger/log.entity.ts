import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum LogType {
  REQUEST = 'request',
  APPLICATION = 'application',
}

@Entity('logs')
@Index(['level', 'createdAt'])
@Index(['type', 'createdAt'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({
    type: 'enum',
    enum: LogType,
    default: LogType.APPLICATION,
  })
  type: LogType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, any>;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  method?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'bigint', nullable: true })
  responseTime?: number;

  @Column({ type: 'text', nullable: true })
  stack?: string;

  @CreateDateColumn()
  createdAt: Date;
}