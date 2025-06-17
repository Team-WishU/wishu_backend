import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Get,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async searchProducts(
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('brand') brand?: string,
  ) {
    return this.productsService.searchProducts({ keyword, tag, brand });
  }

  @Get('autocomplete')
  async getAutoComplete(@Query('input') input: string) {
    return this.productsService.getAutoCompleteKeywords(input);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.create(createProductDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string };
    return this.productsService.updateProductById(
      id,
      updateData,
      user.nickname,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyProducts(@Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.findMyProducts(user.nickname);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.addComment(id, text, user);
  }

  @Get()
  async getAllProducts(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteProductById(id, user.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('category/:category')
  async deleteByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteByCategory(category, user.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async saveProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.saveProductForUser(id, user.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved/my')
  async getSavedProducts(@Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.getSavedProducts(user.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved/category/:category')
  async deleteSavedByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteSavedByCategory(category, user.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async deleteSavedProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteSavedProduct(id, user.nickname);
  }
}
