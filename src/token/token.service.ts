import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {generateTokensDto} from "../DTO/TokenDto";
import {JwtService} from "@nestjs/jwt";
import * as process from "process";
import {PrismaService} from "../prisma.service";
import {Request, Response} from 'express'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService, private prisma: PrismaService) {
  }

  async generateTokens(data: generateTokensDto) {
    try {

      // Create access token, time = 30 minute
      const accessToken = this.jwtService.sign(
        {
          id: data.id,
          email: data.email,
          role: data.role
        },
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
    const refreshToken = await this.prisma.user.findUnique({
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
          message: 'invalid token asd'
        }, HttpStatus.BAD_REQUEST)
      }

      const valid = this.jwtService.verify(result.refreshToken, { secret: process.env.SECRET })
      if (!valid) return false

      const newAccessToken = await this.regenerateAccessByRefresh(result.refreshToken)
      res.cookie('accessToken', newAccessToken)

      return newAccessToken
    }
  }


  async findRefreshTokens(accessToken: string) {
    // Search for the access token in the database
    const findAccessInDb = await this.prisma.user.findUnique({
      where: { accessToken },
      select: { accessToken: true, refreshToken: true }
    })

    // If the access token is not found, return a message
    if (!findAccessInDb) return 'refresh token not found'

    // Return the refresh token associated with the access token
    return findAccessInDb.refreshToken
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      // Verify the refresh token using the secret key
      const isValidRefreshToken = await this.jwtService.verify(refreshToken, { secret: process.env.SECRET })
      return true
    } catch (e) {
      // Log any errors and return false
      console.log(e)
      return false
    }
  }

  async createNewAccessToken(refreshToken: string, res: Response) {
    // Decode the refresh token
    const decodedRefreshToken = await this.jwtService.decode(refreshToken)

    // Sign a new access token using the decoded refresh token data and the secret key
    const newAccessToken = this.jwtService.sign(decodedRefreshToken.data, {secret: process.env.SECRET})

    // Extract the user id from the decoded refresh token data
    const userId: number = decodedRefreshToken.data.id

    // Log the new access token and set it as a cookie in the response
    // console.log('newAccessToken: ' + newAccessToken)
    res.cookie('accessToken', newAccessToken)

    // Update the access token in the database for the user
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        accessToken: newAccessToken
      }
    })

    // Return the new access token
    return newAccessToken
  }

  async tokenManager(accessToken: string, res: Response) {
    // Find the refresh tokens for the given access token
    const findResult = await this.findRefreshTokens(accessToken)
    if (findResult === "refresh token not found") return false

    // Verify the found refresh token
    const verifyTokenResult = await this.verifyRefreshToken(findResult)
    if (!verifyTokenResult) return false

    // Create a new access token using the verified refresh token
    const createResult = await this.createNewAccessToken(findResult, res)
    return createResult
  }
}
