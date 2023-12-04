import {Body, Controller, Get, Post, Req, Res, UseGuards} from '@nestjs/common'
import {CreateReviewDto, DeleteReviewDto, GetReviewByProductId} from '../DTO/ReviewDto'
import {Request, Response} from 'express'
import {ReviewService} from './review.service'
import {UsersGuard} from '../users/users.guard'
import {Roles} from '../users/users.decorator'
import {LoggedInGuard} from '../users/LoggedIn.guard'

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {
  }

  @UseGuards(LoggedInGuard)
  @Post('create')
  async createReview(@Body() body: CreateReviewDto , @Res() res: Response, @Req() req: Request) {
    return this.reviewService.createReview(body, req, res)
  }

  @Get('getall')
  async all() {
    return this.reviewService.getAllReviews()
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('delete')
  async delete(@Body() body: DeleteReviewDto) {
    return this.reviewService.delete(body)
  }

  @Post('all')
  async getReviewByProductId(@Body() body: GetReviewByProductId) {
    return this.reviewService.getAllByProduct(body.id)
  }
}