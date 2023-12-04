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
import {UsersGuard} from "./users/users.guard";
import { FavoriteService } from './favorite/favorite.service';
import { FavoriteModule } from './favorite/favorite.module';
import {ProductService} from "./product/product.service";
import {TokenService} from "./token/token.service";
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { AuthModule } from './auth/auth.module';
import {AuthService} from './auth/auth.service'

@Module({
  imports: [UsersModule, ConfigModule.forRoot({ isGlobal: true }), TokenModule, ProductModule, FavoriteModule, OrderModule, ReviewModule, AuthModule],
  controllers: [AppController, UsersController],
  providers: [AppService, JwtService, UsersGuard, FavoriteService, PrismaService, ProductService, TokenService, AuthService],
})
export class AppModule {}
