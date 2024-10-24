import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CustomConfigService } from './config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}
