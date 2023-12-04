import {Body, Controller, Get, Post, Query, Req, Res, UseGuards} from '@nestjs/common'
import {ChangePasswordDto, ChangeRoleDto, CreateUserDto, LoginDto} from "../DTO/UsersDto";
import {UsersService} from "./users.service";
import {Request, Response} from 'express'
import {Roles} from "./users.decorator";
import {UsersGuard} from "./users.guard";
import {UnauthorisedGuard} from "./login.guard";
import {DeleteProductDto} from "../DTO/ProductDto";
import {LoggedInGuard} from './LoggedIn.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(UnauthorisedGuard)
  @Post('create')
  createUser(@Res({ passthrough: true }) res: Response, @Body() createUser: CreateUserDto) {
    return this.usersService.createUser(createUser, res)
  }

  @UseGuards(UnauthorisedGuard)
  @Post('login')
  async loginUser(@Res({ passthrough: true }) res: Response, @Body() login: LoginDto) {
    return this.usersService.login(login, res)
  }

  @UseGuards(LoggedInGuard)
  @Get('logout')
  async logoutUser(@Res({ passthrough: true }) res: Response) {
    return this.usersService.logout(res)
  }

  @Get()
  async findOne(@Query() query: any) {
    return this.usersService.getAllUsers(query.id)
  }

  @Get('all')
  async getAll() {
    return this.usersService.getAll()
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN', 'USER')
  @Get('test')
  async test() {
    return 'success'
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('/change/role')
  async changeRole(@Body() changeRole: ChangeRoleDto) {
    return this.usersService.changeRole(changeRole)
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('/change/password')
  async changePassword(@Body() changePassword: ChangePasswordDto, @Res() res: Response, @Req() req: Request) {
    return this.usersService.changePassword(changePassword.oldPassword, changePassword.newPassword, res, req)
  }

}
