import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ example: 'warehouse-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 100,
    description: 'Quantity in specified unit (will be converted to yards)',
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    example: 'yard',
    description: 'Unit of measurement (yard, meter, kg, etc.)',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 10, description: 'Minimum quantity threshold in yards' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumQuantity?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum quantity limit in yards' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumQuantity?: number;

  @ApiPropertyOptional({ example: 'A1-B2-C3' })
  @IsString()
  @IsOptional()
  locationCode?: string;
}
