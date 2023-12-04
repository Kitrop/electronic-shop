import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import {JwtService} from '@nestjs/jwt'
import {TokenService} from '../token/token.service'
import {PrismaService} from '../prisma.service'

@Module({
  providers: [AuthService, JwtService, TokenService, PrismaService]
})
export class AuthModule {}
