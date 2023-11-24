import {IsNotEmpty, IsNumber, IsPositive, IsString} from 'class-validator'

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  productId: number

  @IsNumber()
  @IsPositive()
  count: number
}

export class ChangeStatusDto {
  @IsNumber()
  @IsPositive()
  idOrder: number

  @IsString()
  @IsNotEmpty()
  status: string
}