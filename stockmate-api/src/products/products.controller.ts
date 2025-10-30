import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product. All fields (name, fabricId, colorId, warehouseQuantities) are required. Unit conversion rules: Meter → Yard (converts quantity), Yard → Yard (no conversion), Kg → Kg (no conversion).',
  })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created with applied conversion rules.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (missing required fields or invalid data).',
  })
  @ApiResponse({ status: 404, description: 'Fabric, Color, or Warehouse not found.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products with their warehouses.' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Return the product with warehouses.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates a product. Unit conversion rules: Meter → Yard, Yard → Yard, Kg → Kg.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product successfully updated with applied conversion rules.',
  })
  @ApiResponse({ status: 404, description: 'Product, Fabric, Color, or Warehouse not found.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiResponse({ status: 204, description: 'Product successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
