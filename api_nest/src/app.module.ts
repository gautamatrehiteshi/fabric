import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FabricModule } from '@flexper/nest-fabric';
import { ConfigService } from './core/config/config.service';
import { ConfigModule } from './core/config/config.module';
import { FabricLogger } from './core/logger/fabric-logger.service';


@Module({
  imports: [
    FabricModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => configService.fabricConfiguration,
      inject: [ConfigService],
    }),
    ConfigService,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
