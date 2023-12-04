import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {PrismaService} from '../prisma.service'
import {Request, Response} from 'express'
import {ChangeProductDto, CreateProductDto, DeleteProductDto} from '../DTO/ProductDto'
import {JwtService} from '@nestjs/jwt'
import {TokenService} from '../token/token.service'

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly tokenService: TokenService) {
  }

  async addBrand(name: string) {

    const findBrand = await this.prisma.brand.findUnique({
      where: {name}
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
      where: {type}
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
    const averageRating = newProduct.rating.reduce((a, b) => a + b, 0) / newProduct.rating.length

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

  async getAllProducts(category: string, brand: string, name: string, req: Request, res: Response) {
    // Create an empty object for search conditions
    let where = {}
    // If a name is given, add it to the search conditions
    if (name) where['name'] = {contains: name}

    // If a brand is given, search for it in the database
    if (brand) {
      const findBrand = await this.prisma.brand.findUnique({where: {name: brand}})
      // If the brand is not found, throw an exception
      if (!findBrand) {
        throw new HttpException({
          statusCode: 404,
          message: 'brand not found'
        }, HttpStatus.NOT_FOUND)
      } else where['brandId'] = findBrand.id // Otherwise, add the brand id to the search conditions
    }
    // If a category is given, search for it in the database
    if (category) {
      const findCategory = await this.prisma.category.findUnique({where: {type: category}})
      // If the category is not found, throw an exception
      if (!findCategory) {
        throw new HttpException({
          statusCode: 404,
          message: 'category not found'
        }, HttpStatus.NOT_FOUND)
      } else where['categoryId'] = findCategory.id // Otherwise, add the category id to the search conditions
    }

    // Search for products with the given conditions
    const products = await this.prisma.product.findMany({
      where,
      include: {Category: true, Brand: true, Favorite: true}
    })

    // If no products are found, throw an exception
    if (!products.length) {
      throw new HttpException({
        statusCode: 404,
        message: 'not found'
      }, HttpStatus.NOT_FOUND)
    }

    // Get cookies from the request
    const cookies = req.cookies

    let decodeAccessToken: any

    // If there is an accessToken in the cookies, decode it
    if (cookies.accessToken) {
      decodeAccessToken = await this.jwtService.decode(cookies.accessToken)

      // Check the validity of the token
      const data = await this.tokenService.tokenManager(cookies.accessToken, res)

      // If the token is invalid, throw an exception
      if (!data) {
        throw new HttpException({
          statusCode: 400,
          message: 'incorrect token'
        }, HttpStatus.BAD_REQUEST)
      }

      // If the token is valid, decode it
      if (typeof data === 'string')
        decodeAccessToken = await this.jwtService.decode(data)
    }

    // Process the product data
    const productData = products.map(m => {
      // Calculate the average rating
      const averageRating = m.rating.reduce((a, b) => a + b, 0) / m.rating.length
      const roundAverage = Math.round(averageRating * 10) / 10

      let isFavorite = false

      // If there is an accessToken in the cookies, check if the product is a favorite
      if (cookies.accessToken) isFavorite = m.Favorite.some((fav) => m.id === fav.productId && decodeAccessToken.id === fav.userId)

      // Return the processed product data
      return {
        id: m.id,
        name: m.name,
        price: m.price,
        discount: m.discount,
        description: m.description,
        rating: roundAverage,
        brand: m.Brand.name,
        category: m.Category.type,
        isFavorite
      }
    })

    // Return a successful response with the product data
    throw new HttpException({
      statusCode: 200,
      message: 'products get',
      data: productData
    }, HttpStatus.OK)
  }

  async changeProduct(changeProduct: ChangeProductDto) {
    // Check if all the required data is provided
    if (!changeProduct.name && !changeProduct.description && !changeProduct.discount && !changeProduct.description) {
      throw new HttpException({
        statusCode: 400,
        message: 'data is empty'
      }, HttpStatus.BAD_REQUEST)
    }

    // Find the product in the database
    const findProduct = await this.prisma.product.findUnique({
      where: {id: changeProduct.id}
    })

    // If the product is not found, throw an exception
    if (!findProduct) {
      throw new HttpException({
        statusCode: 400,
        message: 'this product not find'
      }, HttpStatus.BAD_REQUEST)
    }

    // Update the product in the database
    const updateProduct = await this.prisma.product.update({
      where: {id: changeProduct.id},
      include: {
        Brand: true,
        Category: true
      },
      data: changeProduct
    })

    // Return a successful response with the updated product data
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
    // Find the product in the database
    const findProduct = await this.prisma.product.findUnique({
      where: {id: deleteProduct.id}
    })

    // If the product is not found, throw an exception
    if (!findProduct) {
      throw new HttpException({
        statusCode: 404,
        message: 'this product was not found'
      }, HttpStatus.NOT_FOUND)
    }

    // Delete the product from the database
    const deletedProduct = await this.prisma.product.delete({
      where: {id: deleteProduct.id}
    })

    // If the product is not deleted, throw an exception
    if (!deletedProduct) {
      throw new HttpException({
        statusCode: 400,
        message: 'product not deleted, try again'
      }, HttpStatus.BAD_REQUEST)
    }

    // Return a successful response indicating the product has been removed
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
