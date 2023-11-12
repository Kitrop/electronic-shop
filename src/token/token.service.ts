import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {generateTokensDto} from "../DTO/TokenDto";
import {JwtService} from "@nestjs/jwt";
import * as process from "process";
import {PrismaService} from "../prisma.service";
import {Response} from "express";

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService, private prisma: PrismaService) {
  }

  async generateTokens(data: generateTokensDto) {
    try {

      // Create access token, time = 30 minute
      const accessToken = this.jwtService.sign(
        {data},
        {
          secret: process.env.SECRET,
          expiresIn: '30m',
        },
      )

      // Create access token, time = 30 minutes
      const refreshToken = this.jwtService.sign(
        {data},
        {
          secret: process.env.SECRET,
          expiresIn: '672h',
        },
      )

      return {
        accessToken,
        refreshToken
      }
    } catch (e) {
      // If the creation of the token failed
      return {
        accessToken: '',
        refreshToken: '',
      }
    }
  }

  async regenerateAccessByRefresh(refreshToken: string) {
    const verifyRefreshToken = await this.jwtService.verify(refreshToken, {secret: process.env.SECRET})
    if (!verifyRefreshToken) {
      throw new HttpException({
        statusCode: 400,
        message: 'refresh token is invalid'
      }, HttpStatus.BAD_REQUEST)
    }

    const payload = {
      id: verifyRefreshToken.id,
      username: verifyRefreshToken.username,
      email: verifyRefreshToken.email,
      role: verifyRefreshToken.role
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.SECRET,
      expiresIn: '30m'
    })

    return accessToken
  }

  async findRefreshToken(accessToken: string, res: Response) {
    const findData = await this.prisma.user.findUnique({
      // @ts-ignore
      where: { accessToken: accessToken },
      select: { refreshToken: true }
    })

    if (!findData || !findData.refreshToken) {
      throw new HttpException({
        statusCode: 404,
        message: 'User not found'
      }, HttpStatus.NOT_FOUND)
    }

    const isValid = await this.jwtService.verify(findData.refreshToken, { secret: process.env.SECRET })

    if (!isValid) {
      throw new HttpException({
        statusCode: 401,
        message: 'Invalid token'
      }, HttpStatus.UNAUTHORIZED)
    }

    const payload = {
      id: isValid.id,
      username: isValid.username,
      emailL: isValid.email,
      role: isValid.role
    }

    const newAccessToken = this.jwtService.sign(payload, {
      secret: process.env.SECRET,
      expiresIn: '30m'
    })

    const updatedUser = await this.prisma.user.update({
      where: {id: isValid.id},
      data: {
        accessToken: newAccessToken,
      },
    });

    res.cookie('accessToken', newAccessToken)

    return newAccessToken
  }
}
