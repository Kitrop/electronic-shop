import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { Observable } from 'rxjs';
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import * as process from "process";
import { Reflector } from '@nestjs/core'
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

    let accessToken = req.cookie.accessToken

    if (!accessToken) {
      throw new HttpException({
        statusCode: 401,
        message: 'Unauthorised user'
      }, HttpStatus.UNAUTHORIZED)
    }

    const decodeAccessToken = this.jwtService.decode(accessToken)

    if(!decodeAccessToken || !decodeAccessToken.exp) {
      throw new HttpException({
        statusCode: 401,
        message: 'Invalid accessToken'
      }, HttpStatus.UNAUTHORIZED)
    }

    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime > decodeAccessToken.exp) {
      accessToken = await this.tokenService.findRefreshToken(accessToken, res)
    }

    const user = this.jwtService.verify(accessToken, {secret: process.env.SECRET})
    req.user = user

    return requiredRoles.includes(user.role)
  }
}
