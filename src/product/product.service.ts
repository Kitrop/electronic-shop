import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma.service";
import {ChangeProductDto, CreateProductDto} from "../DTO/ProductDto";
import {find} from "rxjs";

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

  async getAllProducts() {

    // Get all the products from DB
    const allProductFind = await this.prisma.product.findMany({
      include: {
        Brand: true,
        Category: true
      }
    })

    if (!allProductFind) {
      throw new HttpException({
        statusCode: 400,
        message: 'There is not a single product'
      }, HttpStatus.BAD_REQUEST)
    }

    // Go through the data of each product and return only the necessary data
    const allProduct = allProductFind.map((m) => {
      const averageRating = m.rating.reduce((a, b) => a + b, 0) / m.rating.length;
      return {
        id: m.id,
        name: m.name,
        price: m.price,
        description: m.description,
        brandName: m.Brand.name,
        category: m.Category.type,
        averageRating: averageRating
      }
    })

    // If everything's good, we return all the products
    throw new HttpException({
      statusCode: 200,
      message: 'get all products',
      data: allProduct
    }, HttpStatus.OK)
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
}
