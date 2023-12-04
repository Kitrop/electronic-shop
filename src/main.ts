import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser());

  // TODO: Активация почты
  // TODO: Сделать фото для продуктов

  await app.listen(process.env.PORT, () => console.log(`server started on http://localhost:${process.env.PORT}`))
}
bootstrap();
