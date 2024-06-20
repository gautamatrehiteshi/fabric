import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigurationService } from './core/configuration.service';
import { AppLogger } from './core/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appLogger = app.get(AppLogger);
  app.useLogger(appLogger);

  app.use(
    helmet({
      contentSecurityPolicy: ConfigurationService.isProduction()
        ? undefined
        : false,
    }),
  );
  const configurationService = app.get(ConfigurationService);
  app.enableCors();
  appLogger.log(`logger lvl = ${configurationService.logLevel}`, 'App');
  appLogger.log(`listen to port ${configurationService.webPort}`, 'App');
  appLogger.log(
    `fabric param ${JSON.stringify(configurationService.fabricConfiguration)}`,
    'App',
  );
  await app.listen(configurationService.webPort);
}
bootstrap();
