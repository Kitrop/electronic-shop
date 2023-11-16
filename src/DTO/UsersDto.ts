import {IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length, Matches} from "class-validator";
import {$Enums} from ".prisma/client";
import {IsNotEmail, RoleEnum} from "../utils";


export class CreateUserDto {
  @IsString()
  @Length(4, 40, { message: 'username must be between 4 and 40 characters long'})
  @IsNotEmail({ message: 'username must not be an email'})
  username: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).*$/, {message: 'password too weak'})
  @Length(4, 50, { message: 'password must be between 4 and 50 characters long'})
  password: string
}


export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
  @Length(4, 50, { message: 'password must be between 4 and 50 characters long'})
  password: string
}


export class ChangeRoleDto {
  @IsNumber()
  @IsPositive()
  id: number

  @IsString({ })
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: $Enums.Role
}

export class ChangePasswordDto {
  @IsNumber()
  @IsPositive()
  id: number

  @IsString()
  @Length(4, 50, { message: 'password must be between 4 and 50 characters long'})
  oldPassword: string

  @IsString()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
  @Length(4, 50, { message: 'password must be between 4 and 50 characters long'})
  newPassword: string
}