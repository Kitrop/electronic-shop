import {Body, Controller, Get, Post, Req, Res} from '@nestjs/common'
import {ChangeStatusDto, CreateOrderDto} from '../DTO/Order'
import {OrderService} from './order.service'
import {Request, Response} from 'express'

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {
  }
  @Post('create')
  async createOrder(@Body() createOrder: CreateOrderDto[],@Res() res: Response , @Req() req: Request) {
    return this.orderService.createOrder(createOrder, res, req)
  }
  @Get('delete')
  async delete() {
    return this.orderService.deleteAll()
  }

  @Get('all')
  async all() {
    return this.orderService.getAllOrders()
  }

  @Post('change/status')
  async changeStatus(@Body() changeStatus: ChangeStatusDto) {
    return this.orderService.changeStatusOrder(changeStatus.idOrder, changeStatus.status)
  }

  @Get('my')
  async getMyOrders(@Req() req: Request, @Res() res: Response) {
    return this.orderService.getMyOrders(res, req)
  }
}
