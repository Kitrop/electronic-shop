import {Body, Controller, Get, Post, Query, Res, UseGuards} from '@nestjs/common';
import {ChangeRoleDto, CreateUserDto, LoginDto} from "../DTO/UsersDto";
import {UsersService} from "./users.service";
import {Response} from "express";
import {Roles} from "./users.decorator";
import {UsersGuard} from "./users.guard";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
  }

  @Post('create')
  createUser(@Res({ passthrough: true }) res: Response, @Body() createUser: CreateUserDto) {
    return this.usersService.createUser(createUser, res)
  }

  @Get()
  async findOne(@Query() query: any) {
    return this.usersService.getAllUsers(query.id)
  }

  @Post('login')
  async loginUser(@Res({ passthrough: true }) res: Response, @Body() login: LoginDto) {
    return this.usersService.login(login, res)
  }

  @Get('all')
  async getAll() {
    return this.usersService.getAll()
  }

  @Get('logout')
  async logoutUser(@Res({ passthrough: true }) res: Response) {
    return this.usersService.logout(res)
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Get('test')
  async test() {
    return 'success'
  }

  @Post('changeRole')
  async changeRole(@Body() changeRole: ChangeRoleDto) {
    return this.usersService.changeRole(changeRole)
  }
}
