import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser());

  // TODO: Добавление в избранное
  // TODO: Активация почты
  // TODO: Сделать фото для продуктов
  // TODO: Cделать возможность добавление нескольких ролей в usersGuard

  await app.listen(process.env.PORT, () => console.log(`server started on http://localhost:${process.env.PORT}`))
}
bootstrap();
