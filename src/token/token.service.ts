import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {generateTokensDto} from "../DTO/TokenDto";
import {JwtService} from "@nestjs/jwt";
import * as process from "process";
import {PrismaService} from "../prisma.service";
import {Response} from "express";
import {retry} from "rxjs";

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
          expiresIn: '1m',
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


    console.log('refresh token data')
    console.log(verifyRefreshToken.data.role)

    const payload = {
      id: verifyRefreshToken.data.id,
      username: verifyRefreshToken.data.username,
      email: verifyRefreshToken.data.email,
      role: verifyRefreshToken.data.role
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.SECRET,
      expiresIn: '1m'
    })

    await this.prisma.user.update({
      where: { refreshToken },
      data: { accessToken }
    })

    return accessToken
  }

  async findRefreshToken(accessToken: string, res: Response) {
    const findData = await this.prisma.user.findUnique({
      where: { accessToken: accessToken },
      select: { refreshToken: true }
    })

    console.log(`Find data: ${findData}`)

    if (!findData || !findData.refreshToken) {
      throw new HttpException({
        statusCode: 404,
        message: 'User not found'
      }, HttpStatus.NOT_FOUND)
    }

    const isValid = await this.jwtService.verify(findData.refreshToken, { secret: process.env.SECRET })

    console.log(`isValid: ${isValid}`)

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
      expiresIn: '5m'
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

  async findRefreshInDB(accessToken: string) {
    const refreshToken = this.prisma.user.findUnique({
      where: {
        accessToken
      },
      select: {
        refreshToken: true
      }
    })

    if (!refreshToken) {
      return 'not found'
    }

    return refreshToken
  }


  async isValidAccessToken(accessToken: string, res: Response) {
    try {
      const verifyAccess = this.jwtService.verify(accessToken, { secret: process.env.SECRET })
      return true
    }
    catch (e) {
      const result = await this.findRefreshInDB(accessToken)
      if (result === "not found") return false


      if (!result || !result.refreshToken) {
        throw new HttpException({
          statusCode: 400,
          message: 'invalid token'
        }, HttpStatus.BAD_REQUEST)
      }

      if (result && result.refreshToken) console.log(result.refreshToken)

      const valid = this.jwtService.verify(result.refreshToken, { secret: process.env.SECRET })
      if (!valid) return false

      const newAccessToken = await this.regenerateAccessByRefresh(result.refreshToken)
      res.cookie('accessToken', newAccessToken)

      return newAccessToken
    }
  }
}
