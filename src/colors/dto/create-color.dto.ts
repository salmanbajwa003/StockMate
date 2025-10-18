import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColorDto {
  @ApiProperty({ example: 'Green' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '#00FF00' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'hexCode must be a valid hex color code (e.g., #00FF00)' })
  hexCode?: string;

  @ApiPropertyOptional({ example: 'Bright green color' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
