import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {ChangeRoleDto, CreateUserDto, LoginDto} from "../DTO/UsersDto";
import {PrismaService} from "../prisma.service";
import {compare, hash} from "bcrypt";
import {TokenService} from "../token/token.service";
import {Request, Response} from 'express'
import {isRoleInEnum, RoleEnum} from "../utils";
import {AuthService} from '../auth/auth.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private readonly tokenService: TokenService, private readonly authService: AuthService) {
  }

  async createUser(createUser: CreateUserDto, res: Response) {
    // Finding a user by email, for check
    const emailValidate = await this.prisma.user.findUnique({where: {email: createUser.email}})

    // Checking if a user with this email already exists
    if (emailValidate) {
      throw new HttpException({
        statusCode: 400,
        message: "User with this email address already exists"
      }, HttpStatus.BAD_REQUEST)
    }

    // Checking that the password matches the required length
    if (createUser.password.length < 4 || createUser.password.length > 50)
      throw new HttpException({
        statusCode: 400,
        message: "password must be between 4 and 50 characters long"
      }, HttpStatus.BAD_REQUEST)

    // Checking that the username matches the required length
    if (createUser.username.length < 4 || createUser.username.length > 40) {
      throw new HttpException({
        statusCode: 400,
        message: "username must be between 4 and 40 characters long"
      }, HttpStatus.BAD_REQUEST)
    }

    // Hash the password
    const hashPassword = await hash(createUser.password, 7)

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email: createUser.email,
        username: createUser.username,
        password: hashPassword,
        accessToken: '',
        refreshToken: '',
      },
    })

    // If user not created
    if (!newUser) {
      throw new HttpException({
        statusCode: 400,
        message: "user not created"
      }, HttpStatus.BAD_REQUEST)
    }

    const tokens = await this.tokenService.generateTokens({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    })

    const updatedUser = await this.prisma.user.update({
      where: {id: newUser.id},
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    res.cookie('accessToken', tokens.accessToken, {httpOnly: false, sameSite: 'none'})

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      accessToken: updatedUser.accessToken,
      createdAt: updatedUser.createdAt,
    }
  }

  async getAllUsers(id: string) {
    if (id) {
      let userId = +id

      // Checking if id is a number
      if (typeof userId !== "number") throw new HttpException({
        statusCode: 400,
        message: "id must be a number only"
      }, HttpStatus.BAD_REQUEST)

      // Find user by id
      const userById = await this.prisma.user.findUnique({where: {id: userId}})

      // If user not found
      if (!userById) {
        throw new HttpException({
          statusCode: 404,
          message: "user with this id was not found"
        }, HttpStatus.BAD_REQUEST)
      }

      return {
        id: userById.id,
        username: userById.username,
        email: userById.email,
        role: userById.role,
        createdAt: userById.createdAt,
      }
    } else {
      // Find all users
      const allUsers = await this.prisma.user.findMany()

      // If users empty
      if (allUsers.length === 0) {
        throw new HttpException({
          statusCode: 404,
          message: "users not found. Server Error"
        }, HttpStatus.BAD_REQUEST)
      }

      return allUsers.map(u => {
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        }
      })
    }
  }

  async login(login: LoginDto, res: Response) {

    // Find user by email
    const candidate = await this.prisma.user.findUnique({
      where: {
        email: login.email
      }
    })

    // If user not found
    if (!candidate) {
      throw new HttpException({
        statusCode: 404,
        message: "user not found"
      }, HttpStatus.BAD_REQUEST)
    }

    // Checked password for correct, compare hash password and password from client
    const isValid = await compare(login.password, candidate.password)

    // If password incorrect
    if (!isValid) {
      throw new HttpException({
        statusCode: 400,
        message: "Incorrect password"
      }, HttpStatus.BAD_REQUEST)
    }

    const tokens = await this.tokenService.generateTokens({
      id: candidate.id,
      username: candidate.username,
      email: candidate.email,
      role: candidate.role
    })

    console.log('accessToken:')
    console.log(tokens.accessToken)
    res.cookie('accessToken', tokens.accessToken)

    await this.prisma.user.update({
      where: {id: candidate.id},
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
    console.log('accessToken in user login: ' + tokens.accessToken)

    // User login
    throw new HttpException({
      statusCode: 200,
      message: "Success login"
    }, HttpStatus.OK)
  }

  async logout(res: Response) {
    // Clear cookie
    res.clearCookie('accessToken')

    throw new HttpException({
      statusCode: 200,
      message: 'user logout'
    }, HttpStatus.OK)
  }

  async changeRole(changeRole: ChangeRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: changeRole.id }
    })

    if (!user) {
      throw new HttpException({
        statusCode: 404,
        message: 'user not found'
      }, HttpStatus.NOT_FOUND)
    }

    if(!isRoleInEnum(changeRole.role, RoleEnum)) {
      throw new HttpException({
        statusCode: 400,
        message: `The role of ${changeRole.role} does not exist`
      }, HttpStatus.BAD_REQUEST)

    }

    if (user.role === changeRole.role) {
      throw new HttpException({
        statusCode: 400,
        message: 'this user already has this role'
      }, HttpStatus.BAD_REQUEST)
    }

    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      role: changeRole.role
    })

    const updateUser = await this.prisma.user.update({
      where: {
        id: changeRole.id
      },
      data: {
        role: changeRole.role,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })


    throw new HttpException({
      statusCode: 200,
      message: 'role change',
      data: {
        id: updateUser.id,
        email: updateUser.email,
        username: updateUser.username,
        role: updateUser.role
      }
    }, HttpStatus.OK)
  }

  async changePassword(oldPassword: string, newPassword: string, res: Response, req: Request) {

    // Find userId in accessToken
    const userId = await this.authService.getUserId(res, req)

    // Check if user login
    if (!userId) throw new HttpException({
      statusCode: 403,
      message: 'user not login'
    }, HttpStatus.FORBIDDEN)

    const findUser = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (findUser) throw new HttpException({
      statusCode: 404,
      message: 'user not found'
    }, HttpStatus.NOT_FOUND)

    // If old password match with new password
    if (oldPassword === newPassword) {
      throw new HttpException({
        statusCode: 400,
        message: 'old and new passwords cannot be the same'
      }, HttpStatus.BAD_REQUEST)
    }


    // Check old password with password user from DB
    const isValidPassword = await compare(oldPassword, findUser.password)
    

    // If password not compare
    if (!isValidPassword) {
      throw new HttpException({
        statusCode: 400,
        message: "old passwords incorrect"
      }, HttpStatus.BAD_REQUEST)
    }

    // Hash new password
    const newHashPassword = await hash(newPassword, 7)
    
    // Update user password 
    const updateUser = await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashPassword }
    })

    // If there is an error
    if (!updateUser) {
      throw new HttpException({
        statusCode: 501,
        message: "user's password is not updated, try sending the request again"
      }, HttpStatus.BAD_REQUEST)
    }

    // Return message about new password
    throw new HttpException({
      data: 200,
      message: "password updated"
    }, HttpStatus.OK)
  }

  async getAll() {
    return this.prisma.user.findMany()
  }
}


