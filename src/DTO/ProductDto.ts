import {IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Max, Min} from "class-validator"
import {IsNotEmail} from "../utils";

export class AddBrandDto {
  @IsString() @Length(3, 70)
  name: string
}

export class AddCategoryDto {
  @IsString() @Length(3, 70)
  type: string
}

export class CreateProductDto {
  @IsString() @Length(3, 150) @IsNotEmail({message: 'name must not be an email'})
  name: string

  @IsNumber()
  @IsPositive()
  price: number

  @IsNumber() @Min(0) @Max(99) @IsOptional()
  discount: number

  @IsString() @Length(10, 1500)
  description: string

  @IsOptional() @IsArray() @IsNumber({}, {each: true}) @IsPositive({each: true})
  rating: number[]

  @IsNumber() @IsPositive()
  brandId: number

  @IsNumber() @IsPositive()
  categoryId: number
}


export class ChangeProductDto {
  @IsNumber()
  @IsNotEmpty()
  id: number

  @IsOptional() @IsString()
  name: string

  @IsOptional() @IsNumber() @IsPositive()
  price: number

  @IsOptional() @IsNumber() @Min(0) @Max(99)
  discount: number

  @IsOptional() @IsString() @Length(10, 1500)
  description: string

  @IsNumber() @IsPositive()
  brandId: number

  @IsNumber() @IsPositive()
  categoryId: number
}