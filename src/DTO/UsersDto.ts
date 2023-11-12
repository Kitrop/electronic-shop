import {IsEmail, IsNumber, IsString, Length, Matches} from "class-validator";
import {Role} from "@prisma/client";


export class CreateUserDto {
  @IsString()
  @Length(4, 40, { message: 'username must be between 4 and 40 characters long'})
  username: string

  @IsEmail()
  email: string

  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).*$/, {message: 'password too weak'})
  @Length(4, 50, { message: 'password must be between 4 and 50 characters long'})
  password: string
}


export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}


export class ChangeRoleDto {
  @IsNumber()
  id: number

  @IsString()
  role: Role
}