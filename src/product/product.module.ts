import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {UsersGuard} from "../users/users.guard";
import {TokenService} from "../token/token.service";
import {AuthService} from '../auth/auth.service'

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService, JwtService, TokenService, UsersGuard, AuthService],
  exports: [ProductService]
})
export class ProductModule {}
