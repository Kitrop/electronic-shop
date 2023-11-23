import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {PrismaService} from '../prisma.service'
import {AddToFavoriteDto, removeFavorite} from '../DTO/Favorite'
import {Request, Response} from 'express'
import {TokenService} from '../token/token.service'
import {JwtService} from '@nestjs/jwt'

@Injectable()
export class FavoriteService {
  constructor(private readonly prismaService: PrismaService, private readonly tokenService: TokenService, private readonly jwtService: JwtService) {
  }

  async toggleFavorite(favoriteDto: AddToFavoriteDto, res: Response, req: Request) {
    // Check if such a product exists
    const findProduct = await this.prismaService.product.findUnique({
      where: {id: favoriteDto.productId},
    })

    // If the product does not exist, send an error
    if (!findProduct) {
      throw new HttpException(
        {statusCode: 404, message: 'product not found'},
        HttpStatus.NOT_FOUND,
      )
    }

    // Get a cookie
    const cookies = req.cookies
    // Get accessToken from cookie
    const accessToken = cookies.accessToken

    // If accessToken not exists in cookie
    if (!accessToken) {
      throw new HttpException(
        {statusCode: 400, message: 'no token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    // Check the validity of the token
    // If the token is valid, we get either a new token or true
    // If the token is not valid we get false
    const result = await this.tokenService.isValidAccessToken(accessToken, res)

    // In case we got false
    if (!result) {
      throw new HttpException(
        {statusCode: 400, message: 'invalid token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    // Decode accessToken
    const decode = await this.jwtService.decode(
      typeof result === 'string' ? result : accessToken,
    )

    // Get userID from the decoded token
    const userId: number = decode.id

    // Check if the user has a product with productId in favorites
    const findFavorite = await this.prismaService.favorite.findFirst({
      where: {
        userId,
        productId: favoriteDto.productId,
      },
    })


    // If a user has this product in favorites. Remove from favorites
    if (findFavorite) {
      const removeFavoriteDB = await this.prismaService.favorite.delete({
        where: {id: findFavorite.id},
        include: {Product: true},
      })

      throw new HttpException({
        statusCode: 204,
        message: 'this product has been deleted from favorites',
        data: {
          id: removeFavoriteDB.id,
          userId: removeFavoriteDB.userId,
          productName: removeFavoriteDB.Product.name,
          productId: removeFavoriteDB.productId,
        },
      }, HttpStatus.NO_CONTENT,)
    }
    // If the user does not have this product in his favorites. Add to favorites
    else {
      const createdFavorite = await this.prismaService.favorite.create({
        data: {
          User: {
            connect: {
              id: userId,
            },
          },
          Product: {
            connect: {
              id: favoriteDto.productId,
            },
          },
        },
        include: {Product: true},
      })

      // If an error occurs and the user is not added to favorites
      if (!createdFavorite) {
        throw new HttpException(
          {statusCode: 400, message: 'product not added to favorite'},
          HttpStatus.BAD_REQUEST)
      }

      throw new HttpException({
        statusCode: 201,
        message: 'this product added to favorite',
        data: {
          id: createdFavorite.id,
          userId: createdFavorite.userId,
          productName: createdFavorite.Product.name,
          productId: createdFavorite.productId,
        },
      }, HttpStatus.CREATED)
    }
  }
}
