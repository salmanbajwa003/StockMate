import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @ApiPropertyOptional({ example: '2025-10-18T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ example: 'Special instructions or notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
