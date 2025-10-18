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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory record' })
  @ApiResponse({ status: 201, description: 'Inventory created successfully' })
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory records' })
  @ApiResponse({ status: 200, description: 'Return all inventory records' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.findAll(warehouseId, productId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock inventory items' })
  @ApiResponse({ status: 200, description: 'Return low stock items' })
  findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory record by ID' })
  @ApiResponse({ status: 200, description: 'Return the inventory record' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory record' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  adjustQuantity(@Param('id') id: string, @Body() adjustInventoryDto: AdjustInventoryDto) {
    return this.inventoryService.adjustQuantity(id, adjustInventoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an inventory record' })
  @ApiResponse({ status: 204, description: 'Inventory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}

