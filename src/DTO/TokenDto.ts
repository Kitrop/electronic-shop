import {IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString} from "class-validator";
import {$Enums} from ".prisma/client";

export class generateTokensDto {
  @IsNumber()
  @IsPositive()
  id: number

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  role: $Enums.Role
}
