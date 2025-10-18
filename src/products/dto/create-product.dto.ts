import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Green Khadar Fabric' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Premium quality fabric' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Fabric' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 'yard' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  fabricId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  colorId?: number;

  @ApiPropertyOptional({ example: 'M' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
