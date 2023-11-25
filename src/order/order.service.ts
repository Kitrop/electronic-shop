import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {CreateOrderDto} from '../DTO/Order'
import {PrismaService} from '../prisma.service'
import {Request, Response} from 'express'
import {TokenService} from '../token/token.service'
import {JwtService} from '@nestjs/jwt'
import * as process from 'process'
import {checkUniqArrWithObj, IOrder, productDataMap} from '../utils'
import {rootLogger} from 'ts-jest'

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService,
              private readonly tokenService: TokenService, private readonly jwtService: JwtService) {}

  async createOrder(createOrder: CreateOrderDto[], res: Response, req: Request) {
    // Create an array with products to combine the data conveniently
    const productArr: { productId: number, price: number, count: number }[] = []

    // Get a cookie
    const cookies = req.cookies

    // Create a variable where we will store data from accessToken
    let decodeAccessToken: any

    // If the accessToken does not exist in the cookie
    if (!cookies.accessToken) throw new HttpException({
      statusCode: 403,
      message: 'user not login'
    }, HttpStatus.FORBIDDEN)

    try {
      this.jwtService.verify(cookies.accessToken, {secret: process.env.SECRET})
      decodeAccessToken = await this.jwtService.decode(cookies.accessToken)
    } catch (e) {
      // Request a new accessToken. The request is false if the request is unsuccessful, or a new token is received
      const data = await this.tokenService.tokenManager(cookies.accessToken, res)

      // If false during the request
      if (!data) {
        throw new HttpException({
          statusCode: 400,
          message: 'incorrect token'
        }, HttpStatus.BAD_REQUEST)
      }

      // If a new accessToken has arrived
      if (typeof data === 'string')
        decodeAccessToken = await this.jwtService.verify(data, {secret: process.env.SECRET})
    }

    // If there are too many items in the cart
    if (createOrder.length > 70) throw new HttpException({
      statusCode: 400,
      message: 'too many products in one order'
    }, HttpStatus.BAD_REQUEST)

    // Check that the cart does not contain repeated products
    const checkUniq = checkUniqArrWithObj(createOrder)
    if (!checkUniq) throw new HttpException({
      statusCode: 400,
      message: 'Items in the order must not be repeated'
    }, HttpStatus.BAD_REQUEST)

    try {
      for (let i = 0; i < createOrder.length; i++) {

        // Checking every product for existence
        const findProduct = await this.prisma.product.findUnique({
          where: {id: createOrder[i].productId}
        })

        // If the product does not exist, send an error
        if (!findProduct) throw new HttpException({
          statusCode: 404,
          message: 'product from cart not found'
        }, HttpStatus.NOT_FOUND)

        // Match the data from the array with products with the found price for this product from the database
        productArr[i] = {
          productId: createOrder[i].productId,
          price: findProduct.price,
          count: createOrder[i].count
        }
      }
    } catch (e) {
      console.log(e)
      throw new HttpException({
        statusCode: 404,
        message: 'product from cart not found'
      }, HttpStatus.NOT_FOUND)
    }


    // Creating an order
    const order = await this.prisma.order.create({
      data: {
        status: 'created',
        userId: decodeAccessToken.userId || decodeAccessToken.id,
        summary: productArr.reduce((sum, product) => sum + product.count * product.price, 0)
      }
    })

    // If for some reason the order is not created
    if (!order) throw new HttpException({
      statusCode: 400,
      message: 'order not created'
    }, HttpStatus.BAD_REQUEST)

    // Array to be filled from the intermediate table between "Order" and "Product"
    const order_product = []

    let i = 0
    // We go through all the products that came from the shopping cart
    // And add them to the intermediate table
    for (const product of createOrder) {
      order_product[i] = await this.prisma.order_Product.create({
        data: {
          orderId: order.id,
          productId: product.productId,
          count: product.count
        }
      })
      i++
    }

    // Everything went well
    throw new HttpException({
      statusCode: 201,
      message: 'order created',
      data: order_product
    }, HttpStatus.CREATED)
  }

  async getAllOrders() {
    // Getting all the orders together from the intermediate table
    let result: IOrder[] = await this.prisma.order.findMany({
      include: {
        Order_Product: true
      }
    })

    // Going through the array with order
    for (let i = 0; i < result.length; i++) {

      // Create an array in which we will store data for the modified value of Order_Product
      const arrProduct: productDataMap[] = []

      // Going through Order_Product
      for (let j = 0; j < result[i].Order_Product.length; j++) {

        // Find product data
        const findProduct = await this.prisma.product.findUnique({
          where: {
            id: result[i].Order_Product[j].productId
          }
        })

        if (!findProduct) throw new HttpException({
          statusCode: 400,
          message: 'product with this id does not exist'
        }, HttpStatus.BAD_REQUEST)

        // Create an object that further adds to the array arrProduct
        const productObj = {
          orderId: result[i].Order_Product[j].orderId,
          productId: result[i].Order_Product[j].productId,
          name: findProduct.name,
          price: findProduct.price,
          discount: findProduct.discount,
          count: result[i].Order_Product[j].count
        }

        arrProduct.push(productObj)
      }

      // Change the value of Order_Product to a more detailed value
      result[i].Order_Product = arrProduct
    }

    throw new HttpException({
      statusCode: 200,
      message: 'OK',
      data: result
    }, HttpStatus.OK)
  }

  async getMyOrders(res: Response, req: Request) {
    const cookies = req.cookies

    if (!cookies.accessToken) throw new HttpException({
      statusCode: 403,
      message: 'user is not logged in'
    }, HttpStatus.UNAUTHORIZED)

    let decodeAccessToken: any

    try {
      this.jwtService.verify(cookies.accessToken, {secret: process.env.SECRET})
      decodeAccessToken = await this.jwtService.verify(cookies.accessToken, { secret: process.env.SECRET })
    } catch (e) {
      // Request a new accessToken. The request is false if the request is unsuccessful, or a new token is received
      const data = await this.tokenService.tokenManager(cookies.accessToken, res)

      // If false during the request
      if (!data) {
        throw new HttpException({
          statusCode: 400,
          message: 'incorrect token'
        }, HttpStatus.BAD_REQUEST)
      }

      // If a new accessToken has arrived
      if (typeof data === 'string')
        decodeAccessToken = await this.jwtService.verify(data, {secret: process.env.SECRET})
    }

    const userId = decodeAccessToken.id

    let result: IOrder[] = await this.prisma.order.findMany({
      where: {
        userId
      },
      include: {
        Order_Product: true
      }
    })

    console.log(decodeAccessToken)

    // Going through the array with order
    for (let i = 0; i < result.length; i++) {

      // Create an array in which we will store data for the modified value of Order_Product
      const arrProduct: productDataMap[] = []

      // Going through Order_Product
      for (let j = 0; j < result[i].Order_Product.length; j++) {

        // Find product data
        const findProduct = await this.prisma.product.findUnique({
          where: {
            id: result[i].Order_Product[j].productId
          }
        })

        if (!findProduct) throw new HttpException({
          statusCode: 400,
          message: 'product with this id does not exist'
        }, HttpStatus.BAD_REQUEST)

        // Create an object that further adds to the array arrProduct
        const productObj = {
          orderId: result[i].Order_Product[j].orderId,
          productId: result[i].Order_Product[j].productId,
          name: findProduct.name,
          price: findProduct.price,
          discount: findProduct.discount,
          count: result[i].Order_Product[j].count
        }

        arrProduct.push(productObj)
      }

      // Change the value of Order_Product to a more detailed value
      result[i].Order_Product = arrProduct
    }

    throw new HttpException({
      statusCode: 200,
      message: 'all user orders',
      data: result
    }, HttpStatus.OK)

  }

  async changeStatusOrder(idOrder: number, status: string) {
    const findOrder = await this.prisma.order.findUnique({
      where: { id: idOrder }
    })

    if (!findOrder) throw new HttpException({
      statusCode: 400,
      message: 'order with this id not exist'
    }, HttpStatus.BAD_REQUEST)

    const updateStatus = await this.prisma.order.update({
      where: { id: idOrder },
      data: {
        status
      }
    })

    if (!updateStatus) throw new HttpException({
      statusCode: 400,
      message: 'order not update, try again later'
    }, HttpStatus.BAD_REQUEST)

    throw new HttpException({
      statusCode: 200,
      message: 'order status updated'
    }, HttpStatus.OK)
  }

  async deleteAll() {
    await this.prisma.order_Product.deleteMany()
    await this.prisma.order.deleteMany()
    throw new HttpException({
      statusCode: 200,
      message: 'ok'
    }, HttpStatus.OK)
  }
}
