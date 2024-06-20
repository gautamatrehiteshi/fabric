import { Global, Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { AppLogger } from './logger/app-logger.service';
import { NoOpLogger } from './logger/noop-logger.service';

@Global()
@Module({
  imports: [],
  providers: [ConfigurationService, AppLogger, NoOpLogger],
  exports: [ConfigurationService],
})
export class CoreModule {}
