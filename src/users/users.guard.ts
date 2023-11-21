import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import * as process from "process";
import {Reflector} from '@nestjs/core'
import {ROLES_KEY} from "./users.decorator";


@Injectable()
export class UsersGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly tokenService: TokenService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const res = context.switchToHttp().getResponse()

    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass])
    if (!requiredRoles) {
      return true
    }

    let token = req.cookies

    if (!token.accessToken) {
      throw new HttpException({
        statusCode: 401,
        message: 'Unauthorised user'
      }, HttpStatus.UNAUTHORIZED)
    }

    try {
      const verifyAccessToken = await this.jwtService.verify(token.accessToken, {secret: process.env.SECRET})

      if (!verifyAccessToken) {
        throw new HttpException({
          statusCode: 401,
          message: 'Invalid accessToken, some error'
        }, HttpStatus.UNAUTHORIZED)
      }
    }
    catch (e) {
      // Нужно найти и создать новый токен
      const result = await this.tokenService.isValidAccessToken(token.accessToken, res)

      if (!result) {
        throw new HttpException({
          statusCode: 401,
          message: 'Invalid accessToken, catch'
        }, HttpStatus.UNAUTHORIZED);
      }
      if (typeof result === "string") {
        res.cookie('accessToken', result)
        token.accessToken = result
      }
    }

    try {
      const decodeAccessToken = await this.jwtService.decode(token.accessToken) ///

      if(!decodeAccessToken || !decodeAccessToken.exp) {
        throw new HttpException({
          statusCode: 401,
          message: 'Invalid accessToken by time'
        }, HttpStatus.UNAUTHORIZED)
      }

      const currentTime = Math.floor(Date.now() / 1000)
      if (currentTime > decodeAccessToken.exp) {
        token.accessToken = await this.tokenService.findRefreshToken(token.accessToken, res)
      }

      const user = this.jwtService.verify(token.accessToken, {secret: process.env.SECRET}) ///
      req.user = user

      return requiredRoles.some(role => user.role.includes(role));
    }
    catch(e) {
      console.log(e)
      return false
    }
  }
}

