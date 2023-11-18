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
    const findProduct = await this.prismaService.product.findUnique({
      where: {id: addFavorite.productId},
    });

    if (!findProduct) {
      throw new HttpException(
        {statusCode: 404, message: 'product not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    const cookies = req.cookies;
    const accessToken = cookies.accessToken

    if (!accessToken) {
      throw new HttpException(
        {statusCode: 400, message: 'no token'},
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.tokenService.isValidAccessToken(accessToken, res);

    if (!result) {
      throw new HttpException(
        {statusCode: 400, message: 'invalid token'},
        HttpStatus.BAD_REQUEST,
      );
    }

    const decode = await this.jwtService.decode(
      typeof result === 'string' ? result : accessToken,
    );

    const userId: number = decode.data.id;

    console.log(`userID: ${userId}`)

    const find = await this.prismaService.favorite.findMany({
      where: {
        userId,
        productId: addFavorite.productId,
      },
    });

    if (find.length) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'this user already has this item in his favorites',
        },
        HttpStatus.BAD_REQUEST,
      );
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
      );
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
    );
  }

}
