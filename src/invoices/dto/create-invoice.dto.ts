import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
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
  @ApiProperty({ example: 'INV-2025-001' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  warehouseId: number;

  @ApiPropertyOptional({ example: '2025-10-18T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @ApiPropertyOptional({ example: '2025-11-18T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, example: InvoiceStatus.DRAFT })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: 10.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

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
