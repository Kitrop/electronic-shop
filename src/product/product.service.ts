import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma.service";
import {ChangeProductDto, CreateProductDto, DeleteProductDto} from "../DTO/ProductDto";
import * as util from "util";
import * as fs from "fs";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {
  }

  async addBrand(name: string) {

    const findBrand = await this.prisma.brand.findUnique({
      where: { name }
    })

    if (findBrand) {
      throw new HttpException({
        statusCode: 400,
        message: 'this brand already exists',
      }, HttpStatus.BAD_REQUEST)
    }


    await this.prisma.brand.create({
      data: {
        name
      }
    })

    throw new HttpException({
      statusCode: 201,
      message: 'brand added'
    }, HttpStatus.CREATED)

  }

  async addCategory(type: string) {

    const findCategory = await this.prisma.category.findUnique({
      where: { type }
    })

    console.log('addBrand: ' + type)

    if (findCategory) {
      throw new HttpException({
        statusCode: 400,
        message: 'this category already exists',
      }, HttpStatus.BAD_REQUEST)
    }

    await this.prisma.category.create({
      data: {
        type
      }
    })

    throw new HttpException({
      statusCode: 201,
      message: 'category added'
    }, HttpStatus.CREATED)
  }

  async createProduct(createProduct: CreateProductDto) {

    // Find the brand by id
    const findBrand = await this.prisma.brand.findUnique({
      where: {
        id: createProduct.brandId
      }
    })

    // If no brand is found
    if (!findBrand) {
      throw new HttpException({
        statusCode: 404,
        message: 'this brand not found'
      }, HttpStatus.NOT_FOUND)
    }

    // Find the category by id
    const findCategory = await this.prisma.category.findUnique({
      where: {
        id: createProduct.categoryId
      }
    })

    // If no category is found
    if (!findCategory) {
      throw new HttpException({
        statusCode: 404,
        message: 'this category not found'
      }, HttpStatus.NOT_FOUND)
    }


    // Create new product
    const newProduct = await this.prisma.product.create({
      data: createProduct,
      include: {
        Brand: true,
        Category: true
      }
    })


    // If new product not created
    if (!newProduct) {
      throw new HttpException({
        statusCode: 400,
        message: 'product not created, try again'
      }, HttpStatus.BAD_REQUEST)
    }

    // Average rating for product
    const averageRating = newProduct.rating.reduce((a, b) => a + b, 0) / newProduct.rating.length;

    // Product created
    throw new HttpException({
      statusCode: 201,
      message: 'product created',
      data: {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        discount: newProduct.discount,
        brandName: newProduct.Brand.name,
        category: newProduct.Category.type,
        averageRating
      }
    }, HttpStatus.CREATED)
  }

  async getAllProducts(category: string, brand: string, name: string) {
    let where = {};
    if (name) where['name'] = { contains: name };


    if (brand) {
      const findBrand = await this.prisma.brand.findUnique({ where: { name: brand } })
      if (!findBrand) {
        throw new HttpException({
          statusCode: 404,
          message: 'brand not found'
        }, HttpStatus.NOT_FOUND)
      }
      else where['brandId'] = findBrand.id
    }
    if (category) {
      const findCategory = await this.prisma.category.findUnique({ where: { type: category } })
      if (!findCategory) {
        throw new HttpException({
          statusCode: 404,
          message: 'category not found'
        }, HttpStatus.NOT_FOUND)
      }
      else where['categoryId'] = findCategory.id
    }


    const products = await this.prisma.product.findMany({
      where,
      include: { Category: true, Brand: true }
    });

    if (!products.length) {
      throw new HttpException({
        statusCode: 404,
        message: 'not found'
      }, HttpStatus.NOT_FOUND);
    }

    const productData = products.map(m => {
      const averageRating = m.rating.reduce((a, b) => a + b, 0) / m.rating.length;
      return {
        id: m.id,
        name: m.name,
        price: m.price,
        discount: m.discount,
        description: m.description,
        rating: averageRating,
        brand: m.Brand.name,
        category: m.Category.type
      };
    });

    throw new HttpException({
      statusCode: 200,
      message: 'products get',
      data: productData
    }, HttpStatus.OK);
  }

  async changeProduct(changeProduct: ChangeProductDto) {

    if (!changeProduct.name && !changeProduct.description && !changeProduct.discount && !changeProduct.description) {
      throw new HttpException({
        statusCode: 400,
        message: 'data is empty'
      }, HttpStatus.BAD_REQUEST)
    }

    const findProduct = await this.prisma.product.findUnique({
      where: { id: changeProduct.id }
    })

    if (!findProduct) {
      throw new HttpException({
        statusCode: 400,
        message: 'this product not find'
      }, HttpStatus.BAD_REQUEST)
    }

    const updateProduct = await this.prisma.product.update({
      where: { id: changeProduct.id },
      include: {
        Brand: true,
        Category: true
      },
      data: changeProduct
    })

    throw new HttpException({
      statusCode: 200,
      message: 'product update',
      data: {
        id: updateProduct.id,
        name: updateProduct.name,
        price: updateProduct.price,
        discount: updateProduct.discount,
        description: updateProduct.description,
        brand: updateProduct.Brand.name,
        category: updateProduct.Category.type
      }
    }, HttpStatus.OK)
  }

  async deleteProduct(deleteProduct: DeleteProductDto) {
    const findProduct = await this.prisma.product.findUnique({
      where: { id: deleteProduct.id }
    })

    if (!findProduct) {
      throw new HttpException({
        statusCode: 404,
        message: 'this product was not found'
      }, HttpStatus.NOT_FOUND)
    }

    const deletedProduct = await this.prisma.product.delete({
      where: { id: deleteProduct.id }
    })

    if (!deletedProduct) {
      throw new HttpException({
        statusCode: 400,
        message: 'product not deleted, try again'
      }, HttpStatus.BAD_REQUEST)
    }

    throw new HttpException({
      statusCode: 204,
      message: 'product has been successfully removed',
      data: {
        id: deletedProduct.id,
        name: deletedProduct.name,
        price: deletedProduct.price,
        description: deletedProduct.description
      }
    }, HttpStatus.OK)
  }

  async getAllBrands() {
    const all = await this.prisma.brand.findMany()

    if (!all) {
      throw new HttpException({
        statusCode: 404,
        message: 'not found',
      }, HttpStatus.NOT_FOUND)
    }

    throw new HttpException({
      statusCode: 200,
      message: 'ok',
      data: all
    }, HttpStatus.OK)
  }

  async getAllCategory() {
    const all = await this.prisma.category.findMany()

    if (!all) {
      throw new HttpException({
        statusCode: 404,
        message: 'not found',
      }, HttpStatus.NOT_FOUND)
    }

    throw new HttpException({
      statusCode: 200,
      message: 'ok',
      data: all
    }, HttpStatus.OK)
  }
}
