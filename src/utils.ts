import {$Enums} from "@prisma/client";

export interface IUser {
  id: number,
  username: string,
  email: string,
  password: string,
  role: $Enums.Role,
  createdAt: Date
}

export function isRoleInEnum(role, ENUM) {
  return role in ENUM;
}

export enum RoleEnum {
  "USER",
  "ADMIN",
  "BANNED",
  "NOT_ACTIVE",
}