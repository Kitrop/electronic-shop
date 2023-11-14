import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import * as process from "process";
import {Reflector} from '@nestjs/core'

// TODO: Делать logout если у человека истек срок refreshToken / чистить куки если у человека истек срок refreshToken

@Injectable()
export class UnauthorisedGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly tokenService: TokenService) {
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()

    const cookie = req.cookies

    if (cookie.accessToken) {
      const result = await this.tokenService.findRefreshInDB(cookie.accessToken)

      if (result === "not found") return true
      else {
        const isVerify = await this.jwtService.verify(result.refreshToken, { secret: process.env.SECRET })

        throw new HttpException({
          statusCode: 400,
          message: 'user already login'
        }, HttpStatus.BAD_REQUEST)
      }
    }

    return true
  }
}
