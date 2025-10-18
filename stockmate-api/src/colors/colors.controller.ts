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
import { ColorsService } from './colors.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@ApiTags('colors')
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new color' })
  @ApiResponse({ status: 201, description: 'Color successfully created.' })
  @ApiResponse({ status: 409, description: 'Color name already exists.' })
  create(@Body() createColorDto: CreateColorDto) {
    return this.colorsService.create(createColorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all colors' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Return all colors.' })
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.colorsService.findAll(isActiveBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a color by ID' })
  @ApiResponse({ status: 200, description: 'Return the color.' })
  @ApiResponse({ status: 404, description: 'Color not found.' })
  findOne(@Param('id') id: string) {
    return this.colorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a color' })
  @ApiResponse({ status: 200, description: 'Color successfully updated.' })
  @ApiResponse({ status: 404, description: 'Color not found.' })
  @ApiResponse({ status: 409, description: 'Color name already in use.' })
  update(@Param('id') id: string, @Body() updateColorDto: UpdateColorDto) {
    return this.colorsService.update(id, updateColorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a color (soft delete)' })
  @ApiResponse({ status: 204, description: 'Color successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Color not found.' })
  remove(@Param('id') id: string) {
    return this.colorsService.remove(id);
  }
}
