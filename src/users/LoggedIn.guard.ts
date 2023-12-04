import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import * as process from "process";
import {Reflector} from '@nestjs/core'
import {ROLES_KEY} from "./users.decorator";
import {AuthService} from '../auth/auth.service'


@Injectable()
export class LoggedInGuard  implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly tokenService: TokenService, private readonly reflector: Reflector, private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const res = context.switchToHttp().getResponse()

    const cookies = req.cookies;
    let decodeAccessToken: any;

    try {
      this.jwtService.verify(cookies.accessToken, { secret: process.env.SECRET });
      decodeAccessToken = await this.jwtService.verify(cookies.accessToken, { secret: process.env.SECRET });
    } catch (e) {
      const data = await this.tokenService.tokenManager(cookies.accessToken, res);

      if (!data) {
        throw new HttpException({
          statusCode: 401,
          message: 'user not login'
        }, HttpStatus.UNAUTHORIZED)
      }

      if (typeof data === 'string') {
        try {
          decodeAccessToken = await this.jwtService.verify(data, { secret: process.env.SECRET });
          return true
        }
        catch (e) {
          throw new HttpException({
            statusCode: 401,
            message: 'user not login'
          }, HttpStatus.UNAUTHORIZED)
        }
      }
    }

    return true
  }
}

