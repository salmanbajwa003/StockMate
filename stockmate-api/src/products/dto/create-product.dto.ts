import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WarehouseQuantityDto } from './warehouse-quantity.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Green Khadar Fabric' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  fabricId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  colorId: number;

  @ApiPropertyOptional({ example: 99.99 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 'yard' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    type: [WarehouseQuantityDto],
    description: 'Array of warehouses with their quantities and units (at least one required)',
    example: [
      {
        warehouseId: 1,
        quantity: 100,
        unit: 'meter',
      },
      {
        warehouseId: 2,
        quantity: 50,
        unit: 'yard',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WarehouseQuantityDto)
  @IsNotEmpty()
  warehouseQuantities: WarehouseQuantityDto[];
}
