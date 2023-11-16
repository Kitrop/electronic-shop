import {Body, Controller, Get, Post, Query, Res, UseGuards} from '@nestjs/common';
import {ChangePasswordDto, ChangeRoleDto, CreateUserDto, LoginDto} from "../DTO/UsersDto";
import {UsersService} from "./users.service";
import {Response} from "express";
import {Roles} from "./users.decorator";
import {UsersGuard} from "./users.guard";
import {UnauthorisedGuard} from "./login.guard";

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
  @Roles('ADMIN')
  @Get('test')
  async test() {
    return 'success'
  }


  @Post('/change/role')
  async changeRole(@Body() changeRole: ChangeRoleDto) {
    return this.usersService.changeRole(changeRole)
  }

  @Post('/change/password')
  async changePassword(@Body() changePassword: ChangePasswordDto) {
    return this.usersService.changePassword(changePassword.id, changePassword.oldPassword, changePassword.newPassword)
  }
}
