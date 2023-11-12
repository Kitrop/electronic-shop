import {IsEmail, IsNumber, IsString} from "class-validator";

export class generateTokensDto {
  @IsNumber()
  id: number

  @IsEmail()
  email: string

  @IsString()
  username: string

  @IsString()
  role: string
}
