import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import {ConfigModule} from "@nestjs/config";
import {PrismaService} from "./prisma.service";
import { TokenModule } from './token/token.module';
import {JwtService} from "@nestjs/jwt";
import { ProductModule } from './product/product.module';

@Module({
  imports: [UsersModule, ConfigModule.forRoot({ isGlobal: true }), TokenModule, ProductModule],
  controllers: [AppController, UsersController],
  providers: [AppService, JwtService],
})
export class AppModule {}
