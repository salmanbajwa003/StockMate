import { IsNumber, IsNotEmpty, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Special instructions' })
  @IsString()
  @IsOptional()
  notes?: string;
}

