import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {JwtService} from '@nestjs/jwt'
import {TokenService} from '../token/token.service'
import {Request, Response} from 'express'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly tokenService: TokenService) {
  }
  async getUserId(res: Response, req: Request) {
    const cookies = req.cookies;
    let decodeAccessToken: any;

    try {
      this.jwtService.verify(cookies.accessToken, { secret: process.env.SECRET });
      decodeAccessToken = await this.jwtService.verify(cookies.accessToken, { secret: process.env.SECRET });
    } catch (e) {
      const data = await this.tokenService.tokenManager(cookies.accessToken, res);

      if (!data) {
        throw new HttpException({
          statusCode: 400,
          message: 'incorrect token'
        }, HttpStatus.BAD_REQUEST);
      }

      if (typeof data === 'string') {
        decodeAccessToken = await this.jwtService.verify(data, { secret: process.env.SECRET });
      }
    }

    return decodeAccessToken.id;
  }
}
