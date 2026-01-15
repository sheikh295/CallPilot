import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CallsController } from './calls.controller';
import { WebhooksController } from './webhooks.controller';
import { CallsService } from './calls.service';
import { Call } from '../../entities/call.entity';
import { Contact } from '../../entities/contact.entity';
import { LogsModule } from '../../services/logger/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Call, Contact]),
    LogsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CallsController, WebhooksController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}