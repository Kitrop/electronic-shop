import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma.service";
import {AddToFavoriteDto} from "../DTO/Favorite";
import {Request, Response} from 'express';
import {TokenService} from "../token/token.service";
import {JwtService} from "@nestjs/jwt";
import * as process from "process";

@Injectable()
export class FavoriteService {
  constructor(private readonly prismaService: PrismaService, private readonly tokenService: TokenService, private readonly jwtService: JwtService) {
  }

  async addToFavorite(addFavorite: AddToFavoriteDto, res: Response, req: Request) {

    // Find product by id
    const findProduct = this.prismaService.product.findUnique({
      where: {id: addFavorite.productId}
    })

    // If the product with this id does not exist
    if (!findProduct) throw new HttpException({
      statusCode: 404,
      message: 'product not found'
    }, HttpStatus.NOT_FOUND)

    // Get the token from the cookie
    const accessToken = req.cookies('accessToken')

    // If the token is missing
    if (!accessToken) throw new HttpException({
      statusCode: 400,
      message: 'no token'
    }, HttpStatus.BAD_REQUEST)


    // Check the token for validity or get a new token using the method from tokenService
    const result = await this.tokenService.isValidAccessToken(accessToken, res)

    // If the result of the method returned false
    if (!result) {
      throw new HttpException({
        statusCode: 400,
        message: 'invalid token'
      }, HttpStatus.BAD_REQUEST)
    } else {
      // If we have a new token returned to us
      if (typeof result === "string") {

        // Decode the token to get data from it
        const decode = await this.jwtService.decode(result)

        console.log("DECODED:")
        console.log(decode)

        // Get user id from token
        const userId: number = decode.id

        // TODO: Сделать проверку на то что у пользователя не добавлен этот товар

        const find = await this.prismaService.favorite.findMany({
          where: {
            userId,
            productId: addFavorite.productId
          }
        })

        if (find.length) {
          throw new HttpException({
            statusCode: 400,
            message: 'this user already has this item in his favorites'
          }, HttpStatus.BAD_REQUEST)
        }

        // Add product to favorites
        const createdFavorite = await this.prismaService.favorite.create({
          data: {
            userId,
            productId: addFavorite.productId,
          },
          include: {Product: true}
        })

        // If the product has not been added to your favorites
        if (!createdFavorite) throw new HttpException({
          statusCode: 400,
          message: 'product not added to favorite'
        }, HttpStatus.BAD_REQUEST)
      }
      // If the method returned true
      else {
        const decodeAccessToken = await this.jwtService.decode(accessToken)
        const userId: number = decodeAccessToken.id


        const find = await this.prismaService.favorite.findMany({
          where: {
            userId,
            productId: addFavorite.productId
          }
        })

        if (find.length) {
          throw new HttpException({
            statusCode: 400,
            message: 'this user already has this item in his favorites'
          }, HttpStatus.BAD_REQUEST)
        }

        const createdFavorite = await this.prismaService.favorite.create({
          data: {
            userId: userId,
            productId: addFavorite.productId,
          },
          include: {Product: true}
        })

        throw new HttpException({
          statusCode: 201,
          message: 'this product added to favorite',
          data: {
            id: createdFavorite.id,
            userId: createdFavorite.userId,
            productName: createdFavorite.Product.name,
            productId: createdFavorite.productId,
          }
        }, HttpStatus.CREATED)
      }

    }
  }
}
