import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
    constructor(private readonly prisma: Prisma) {}
    async addBrand(name: string) {
        t
    }
}
