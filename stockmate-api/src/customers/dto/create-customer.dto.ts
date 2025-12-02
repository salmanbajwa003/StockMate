import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '03334567890' })
  @IsString()
  @IsOptional()
  phone?: string;

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

  @ApiPropertyOptional({ example: 'John Driver' })
  @IsString()
  @IsOptional()
  driver_name?: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsString()
  @IsOptional()
  vehicle_make?: string;

  @ApiPropertyOptional({ example: 'DRV12345' })
  @IsString()
  @IsOptional()
  driver_no?: string;
}
