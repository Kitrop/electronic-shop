import {IsNumber, IsPositive, IsString} from 'class-validator'

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  productId: number

  @IsNumber()
  @IsPositive()
  count: number
}