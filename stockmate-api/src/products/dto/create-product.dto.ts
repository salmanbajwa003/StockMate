import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
