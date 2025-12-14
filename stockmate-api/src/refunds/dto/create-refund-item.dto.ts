import {
  IsNumber,
  IsEnum,
  IsPositive,
  Min,
  IsString,
  IsNotEmpty,
  IsNumberString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitType } from '../../common/utils/unit-converter';

export class CreateRefundItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  itemId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @IsPositive()
  originalQuantity: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  refundQuantity: number;

  @ApiProperty({ enum: UnitType, example: UnitType.YARD })
  @IsEnum(UnitType)
  unit: UnitType;

  @ApiProperty({ example: 12.0 })
  @IsString()
  @IsNumberString()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({ example: 24 })
  @IsNumber()
  @IsPositive()
  refundAmount: number;
}
