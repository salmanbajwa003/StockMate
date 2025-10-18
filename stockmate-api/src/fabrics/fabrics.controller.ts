import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FabricsService } from './fabrics.service';
import { CreateFabricDto } from './dto/create-fabric.dto';
import { UpdateFabricDto } from './dto/update-fabric.dto';

@ApiTags('fabrics')
@Controller('fabrics')
export class FabricsController {
  constructor(private readonly fabricsService: FabricsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fabric type' })
  @ApiResponse({ status: 201, description: 'Fabric successfully created.' })
  @ApiResponse({ status: 409, description: 'Fabric name already exists.' })
  create(@Body() createFabricDto: CreateFabricDto) {
    return this.fabricsService.create(createFabricDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fabrics' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Return all fabrics.' })
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.fabricsService.findAll(isActiveBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a fabric by ID' })
  @ApiResponse({ status: 200, description: 'Return the fabric.' })
  @ApiResponse({ status: 404, description: 'Fabric not found.' })
  findOne(@Param('id') id: string) {
    return this.fabricsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fabric' })
  @ApiResponse({ status: 200, description: 'Fabric successfully updated.' })
  @ApiResponse({ status: 404, description: 'Fabric not found.' })
  @ApiResponse({ status: 409, description: 'Fabric name already in use.' })
  update(@Param('id') id: string, @Body() updateFabricDto: UpdateFabricDto) {
    return this.fabricsService.update(id, updateFabricDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a fabric (soft delete)' })
  @ApiResponse({ status: 204, description: 'Fabric successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Fabric not found.' })
  remove(@Param('id') id: string) {
    return this.fabricsService.remove(id);
  }
}
