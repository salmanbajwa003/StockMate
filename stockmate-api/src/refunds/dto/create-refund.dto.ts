import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsPositive,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateRefundItemDto } from './create-refund-item.dto';

export class CreateRefundDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  invoiceId: number;

  @ApiProperty({ example: '1211' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  warehouseId: number;

  @ApiProperty({ type: [CreateRefundItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRefundItemDto)
  refundItems: CreateRefundItemDto[];

  @ApiProperty({ example: 'Product defect', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 24 })
  @IsNumber()
  @IsPositive()
  totalRefundAmount: number;
}

