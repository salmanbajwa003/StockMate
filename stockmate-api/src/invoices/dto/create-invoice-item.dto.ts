import { IsNumber, IsNotEmpty, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '../../common/utils/unit-converter';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: UnitType, example: UnitType.METER })
  @IsEnum(UnitType)
  @IsNotEmpty()
  unit: UnitType;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

