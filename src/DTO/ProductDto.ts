import { IsNumber, IsString, Length, MinLength } from "class-validator"

export class AddBrand {
    @IsString()
    @Length(3, 70)
    name: string
}

export class AddCategory {
    @IsString()
    @Length(3, 70)
    type: string
}

export class CreateProduct {
    @IsString()
    @Length(3, 150)
    name: string

    @IsNumber()
    price: number

    @IsString()
    @Length(10, 500)
    description: string

    @IsNumber()
    brandId: number

    @IsNumber()
    categoryId: number
}