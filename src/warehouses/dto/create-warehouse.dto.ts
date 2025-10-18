import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Warehouse' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

