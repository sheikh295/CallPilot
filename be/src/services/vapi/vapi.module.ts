import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VapiService } from './vapi.service';

@Module({
  imports: [ConfigModule],
  providers: [VapiService],
  exports: [VapiService],
})
export class VapiModule {}
