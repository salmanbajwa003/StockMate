import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitType } from '@/common/utils/unit-converter';

export class WarehouseQuantityDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 'meter',
    description:
      'Unit type: meter (will be converted to yard), yard (no conversion), or kg (no conversion)',
    enum: UnitType,
  })
  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;
}
