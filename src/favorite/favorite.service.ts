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

  async addToFavorite(addFavorite: AddToFavoriteDto, res: Response, req: Request) {
    const findProduct = await this.prismaService.product.findUnique({
      where: {id: addFavorite.productId},
    })

    if (!findProduct) {
      throw new HttpException(
        {statusCode: 404, message: 'product not found'},
        HttpStatus.NOT_FOUND,
      )
    }

    const cookies = req.cookies
    const accessToken = cookies.accessToken

    if (!accessToken) {
      throw new HttpException(
        {statusCode: 400, message: 'no token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const result = await this.tokenService.isValidAccessToken(accessToken, res)

    if (!result) {
      throw new HttpException(
        {statusCode: 400, message: 'invalid token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const decode = await this.jwtService.decode(
      typeof result === 'string' ? result : accessToken,
    )

    const userId: number = decode.data.id


    const find = await this.prismaService.favorite.findFirst({
      where: {
        userId,
        productId: addFavorite.productId,
      },
    })

    if (find) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'this user already has this item in his favorites',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const createdFavorite = await this.prismaService.favorite.create({
      data: {
        User: {
          connect: {
            id: userId,
          },
        },
        Product: {
          connect: {
            id: addFavorite.productId,
          },
        },
      },
      include: {
        Product: true,
      },
    })

    if (!createdFavorite) {
      throw new HttpException(
        {statusCode: 400, message: 'product not added to favorite'},
        HttpStatus.BAD_REQUEST,
      )
    }

    throw new HttpException(
      {
        statusCode: 201,
        message: 'this product added to favorite',
        data: {
          id: createdFavorite.id,
          userId: createdFavorite.userId,
          productName: createdFavorite.Product.name,
          productId: createdFavorite.productId,
        },
      },
      HttpStatus.CREATED,
    )
  }

  async removeFavorite(removeFavorite: removeFavorite, res: Response, req: Request) {
    const findProduct = await this.prismaService.product.findUnique({
      where: {id: removeFavorite.productId},
    })

    if (!findProduct) {
      throw new HttpException(
        {statusCode: 404, message: 'product not found'},
        HttpStatus.NOT_FOUND,
      )
    }

    const cookies = req.cookies
    const accessToken = cookies.accessToken

    if (!accessToken) {
      throw new HttpException(
        {statusCode: 400, message: 'no token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const result = await this.tokenService.isValidAccessToken(accessToken, res)

    if (!result) {
      throw new HttpException(
        {statusCode: 400, message: 'invalid token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const decode = await this.jwtService.decode(
      typeof result === 'string' ? result : accessToken,
    )

    const userId: number = decode.data.id


    const findFavorite = await this.prismaService.favorite.findFirst({
      where: {
        userId,
        productId: removeFavorite.productId,
      },
    })

    if (!findFavorite) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'this user does not have this product in his favorites',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const removeFavoriteDB = await this.prismaService.favorite.delete({
      where: {
        id: findFavorite.id
      },
      include: {
        Product: true
      }
    })


    throw new HttpException(
      {
        statusCode: 204,
        message: 'this product has been deleted from favorites',
        data: {
          id: removeFavoriteDB.id,
          userId: removeFavoriteDB.userId,
          productName: removeFavoriteDB.Product.name,
          productId: removeFavoriteDB.productId,
        },
      },
      HttpStatus.NO_CONTENT,
    )
  }

  async toggleFavorite(favoriteDto: AddToFavoriteDto, res: Response, req: Request) {
    const findProduct = await this.prismaService.product.findUnique({
      where: {id: favoriteDto.productId},
    })

    if (!findProduct) {
      throw new HttpException(
        {statusCode: 404, message: 'product not found'},
        HttpStatus.NOT_FOUND,
      )
    }

    const cookies = req.cookies
    const accessToken = cookies.accessToken

    if (!accessToken) {
      throw new HttpException(
        {statusCode: 400, message: 'no token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const result = await this.tokenService.isValidAccessToken(accessToken, res)

    if (!result) {
      throw new HttpException(
        {statusCode: 400, message: 'invalid token'},
        HttpStatus.BAD_REQUEST,
      )
    }

    const decode = await this.jwtService.decode(
      typeof result === 'string' ? result : accessToken,
    )

    console.log(decode)
    const userId: number = decode.id

    const findFavorite = await this.prismaService.favorite.findFirst({
      where: {
        userId,
        productId: favoriteDto.productId,
      },
    })

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
    } else {
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
