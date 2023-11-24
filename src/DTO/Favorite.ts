import {IsNotEmpty, IsNumber, IsPositive, IsString} from "class-validator";


export class AddToFavoriteDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number
}

export class removeFavorite {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number
}