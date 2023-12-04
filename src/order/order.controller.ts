import {Body, Controller, Get, Post, Req, Res, UseGuards} from '@nestjs/common'
import {ChangeStatusDto, CreateOrderDto} from '../DTO/Order'
import {OrderService} from './order.service'
import {Request, Response} from 'express'
import {LoggedInGuard} from '../users/LoggedIn.guard'
import {UsersGuard} from '../users/users.guard'
import {Roles} from '../users/users.decorator'

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {
  }

  @UseGuards(LoggedInGuard)
  @Post('create')
  async createOrder(@Body() createOrder: CreateOrderDto[],@Res() res: Response , @Req() req: Request) {
    return this.orderService.createOrder(createOrder, res, req)
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Get('delete')
  async delete() {
    return this.orderService.deleteAll()
  }

  @Get('all')
  async all() {
    return this.orderService.getAllOrders()
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('change/status')
  async changeStatus(@Body() changeStatus: ChangeStatusDto) {
    return this.orderService.changeStatusOrder(changeStatus.idOrder, changeStatus.status)
  }

  @UseGuards(LoggedInGuard)
  @Get('my')
  async getMyOrders(@Req() req: Request, @Res() res: Response) {
    return this.orderService.getMyOrders(res, req)
  }
}
