import {Body, Controller, Post, Req, Res} from '@nestjs/common';
import {FavoriteService} from "./favorite.service";
import {AddToFavoriteDto} from "../DTO/Favorite";
import {Response, Request } from "express";

@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {
  }

  @Post('/')
  async addFavorite(@Body() body: AddToFavoriteDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.favoriteService.toggleFavorite(body, res, req)
  }
}
