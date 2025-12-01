import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 100.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ example: 'Payment notes or additional information' })
  @IsString()
  @IsOptional()
  notes?: string;
}
