import {$Enums} from "@prisma/client";

export interface IUser {
  id: number,
  username: string,
  email: string,
  password: string,
  role: $Enums.Role,
  createdAt: Date
}