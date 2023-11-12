import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import {JwtService} from "@nestjs/jwt";
import {PrismaService} from "../prisma.service";

@Module({
  providers: [TokenService, JwtService, PrismaService],
  exports: [TokenService]
})
export class TokenModule {}
