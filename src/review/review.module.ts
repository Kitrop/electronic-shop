import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import {JwtService} from '@nestjs/jwt'
import {PrismaService} from '../prisma.service'
import {TokenService} from '../token/token.service'
import {AuthService} from '../auth/auth.service'

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, JwtService, PrismaService, TokenService, AuthService]
})
export class ReviewModule {}
