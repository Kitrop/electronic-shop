import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import {PrismaService} from '../prisma.service'
import {JwtService} from '@nestjs/jwt'
import {TokenService} from '../token/token.service'

@Module({
  providers: [OrderService, PrismaService, JwtService, TokenService],
  controllers: [OrderController]
})
export class OrderModule {}
