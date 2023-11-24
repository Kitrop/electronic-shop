import {$Enums} from "@prisma/client";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";

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

@ValidatorConstraint({ async: true })
export class IsNotEmailConstraint implements ValidatorConstraintInterface {
  validate(username: any, args: ValidationArguments) {
    const re = /\S+@\S+\.\S+/;
    return !re.test(username);
  }
}

export function IsNotEmail(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotEmailConstraint,
    });
  };
}

[{}, {}, {}]
{

}


export function checkUniqArrWithObj(arr: ObjArr[]) {
  const map = new Map()
  return !arr.some(obj => map.has(obj.productId) ? true : !map.set(obj.productId, true))
}

interface ObjArr {
  productId: number,
  count: number
}

export interface IOrder {
  id: number,
  userId: number,
  summary: number,
  status: string,
  Order_Product: InterfaceOrderProduct[]
}

interface InterfaceOrderProduct {
  orderId: number,
  productId: number,
  count: number
}

export interface productDataMap {
  orderId: number,
  productId: number,
  name: string,
  price: number,
  discount: number,
  count: number
}