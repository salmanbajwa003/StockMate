import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty({
    example: 10,
    description: 'Quantity to adjust in specified unit (positive to add, negative to remove)',
  })
  @IsNumber()
  adjustment: number;

  @ApiPropertyOptional({
    example: 'yard',
    description: 'Unit of adjustment (will be converted to yards if different)',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 'Restocking', description: 'Reason for adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;
}
