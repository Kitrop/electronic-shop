import {Body, Controller, Get, Post, UseGuards} from '@nestjs/common';
import {ProductService} from "./product.service";
import {AddBrandDto, AddCategoryDto, ChangeProductDto, CreateProductDto} from "../DTO/ProductDto";
import {UsersGuard} from "../users/users.guard";
import {Roles} from "../users/users.decorator";

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(UsersGuard)
  @Roles('ADMIN', 'USER')
  @Post('/brand/add')
  async createBrand(@Body() createProduct: AddBrandDto) {
    return this.productService.addBrand(createProduct.name)
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('/category/add')
  async createCategory(@Body() createProduct: AddCategoryDto) {
    return this.productService.addCategory(createProduct.type)
  }

  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('add')
  async addProduct(@Body() createProduct: CreateProductDto) {
    return this.productService.createProduct(createProduct)
  }



  @UseGuards(UsersGuard)
  @Roles('ADMIN')
  @Post('change')
  async changeProduct(@Body() changeProduct: ChangeProductDto) {
    return this.productService.changeProduct(changeProduct)
  }


  @Get('all')
  async getAll() {
    return this.productService.getAllProducts()
  }


}
