import {IsNumber, IsPositive, IsString, Max, Min} from 'class-validator'
import {Transform, TransformFnParams} from 'class-transformer'
import * as sanitizeHtml from 'sanitize-html';


export class CreateReviewDto {
  @IsNumber()
  @IsPositive()
  productId: number

  @IsString()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  text: string

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number
}

export class DeleteReviewDto {
  @IsNumber()
  @IsPositive()
  id: number
}

export class GetReviewByProductId {
  @IsNumber()
  @IsPositive()
  id: number
}