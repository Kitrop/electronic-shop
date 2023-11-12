import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {UsersController} from "./users.controller";
import {PrismaService} from "../prisma.service";
import {TokenService} from "../token/token.service";
import {JwtService} from "@nestjs/jwt";

@Module({
  providers: [UsersService, PrismaService, TokenService, JwtService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
