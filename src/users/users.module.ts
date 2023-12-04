import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {UsersController} from "./users.controller";
import {PrismaService} from "../prisma.service";
import {TokenService} from "../token/token.service";
import {JwtService} from "@nestjs/jwt";
import {UsersGuard} from "./users.guard";
import {AuthService} from '../auth/auth.service'

@Module({
  providers: [UsersService, PrismaService, TokenService, JwtService, UsersService, UsersGuard, AuthService],
  controllers: [UsersController],
  exports: [UsersService, UsersGuard]
})
export class UsersModule {}
