import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '03334567890' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '03334567890' })
  @IsString()
  @IsOptional()
  phone_number2?: string;

  @ApiPropertyOptional({ example: '03334567890' })
  @IsString()
  @IsOptional()
  phone_number3?: string;

  @ApiPropertyOptional({ example: '123 Main Street, New York, NY 10001' })
  @IsString()
  @IsOptional()
  address?: string;
}
