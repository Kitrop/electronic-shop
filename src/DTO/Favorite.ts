import {IsNotEmpty, IsNumber, IsPositive} from "class-validator";


export class AddToFavoriteDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number
}