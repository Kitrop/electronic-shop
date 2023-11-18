import { Module } from '@nestjs/common';
import { FavoriteController } from './favorite.controller';
import {FavoriteService} from "./favorite.service";
import {PrismaService} from "../prisma.service";
import {TokenService} from "../token/token.service";
import {JwtService} from "@nestjs/jwt";

@Module({
  providers: [FavoriteService, PrismaService, TokenService, JwtService],
  controllers: [FavoriteController],
  exports: [FavoriteService]
})
export class FavoriteModule {}
