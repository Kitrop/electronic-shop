import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {CreateReviewDto, DeleteReviewDto} from '../DTO/ReviewDto'
import {PrismaService} from '../prisma.service'
import {JwtService} from '@nestjs/jwt'
import {Request, Response} from 'express'
import {TokenService} from '../token/token.service'
import {AuthService} from '../auth/auth.service'

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly tokenService: TokenService, private readonly authService: AuthService) {}

  async createReview(createReview: CreateReviewDto, req: Request, res: Response) {
    const findProduct = await this.prisma.product.findUnique({
      where: { id: createReview.productId }
    })

    if (!createReview) throw new HttpException({
      statusCode: 404,
      message: 'this product not find'
    }, HttpStatus.NOT_FOUND)

    const userId = await this.authService.getUserId(res, req)

    const create = await this.prisma.review.create({
      data: {
        userId,
        productId: createReview.productId,
        text: createReview.text,
        rating: createReview.rating
      }
    })

    if (!create) throw new HttpException({
      statusCode: 500,
      message: 'some error, try later'
    }, HttpStatus.BAD_REQUEST)

    const ratingArr = findProduct.rating
    ratingArr.push(createReview.rating)

    const upd = await this.prisma.product.update({
      where: { id: createReview.productId },
      data: {
        rating: ratingArr
      }
    })

    throw new HttpException({
      statusCode: 201,
      message: 'review successfully created'
    }, HttpStatus.CREATED)
  }

  async getAllReviews() {
    const all = await this.prisma.review.findMany()
    if (!all) throw new HttpException({
      statusCode: 400,
      message: 'no reviews'
    }, HttpStatus.BAD_REQUEST)

    return all
  }

  async delete(del: DeleteReviewDto) {
    const findReview = await this.prisma.review.findUnique({
      where: { id: del.id }
    })

    if (!findReview) throw new HttpException({
      statusCode: 404,
      message: 'review with this id not found'
    }, HttpStatus.NOT_FOUND)

    await this.prisma.review.delete({
      where: {
        id: del.id
      }
    })

    throw new HttpException({
      statusCode: 204,
      message: 'review successful delete'
    }, HttpStatus.NO_CONTENT)
  }

  async getAllByProduct(id: number) {
    const findProductId = await this.prisma.product.findUnique({
      where: { id }
    })

    if (!findProductId) throw new HttpException({
      statusCode: 404,
      message: 'product with this id not found'
    }, HttpStatus.NOT_FOUND)

    const reviews = await this.prisma.review.findMany({
      where: { productId: id }
    })

    throw new HttpException({
      statusCode: 200,
      message: 'all product reviews with that id',
      data: reviews
    }, HttpStatus.OK)
  }
}
