import {IsEmail, IsNumber, IsString} from "class-validator";
import {$Enums} from ".prisma/client";

export class generateTokensDto {
  @IsNumber()
  id: number

  @IsEmail()
  email: string

  @IsString()
  username: string

  @IsString()
  role: $Enums.Role
}
