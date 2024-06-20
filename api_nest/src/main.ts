import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HomeMadeSwaggerModule, HomeMadeDocumentBuilder } from '@flexper/nest-fabric';
import { CustomSwaggerSchema } from '@flexper/nest-fabric/dist/swagger/type';
import { SwaggerModule } from '@nestjs/swagger';
import * as schema from '../data/model.json';


async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const options = new HomeMadeDocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .addBearerAuth()
    .setSwaggerSchema(schema as any as CustomSwaggerSchema)
    .build();

  const document = HomeMadeSwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api", app, document);
  await app.listen(3000);
}
bootstrap();
