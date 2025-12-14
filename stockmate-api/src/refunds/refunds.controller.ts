import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new refund' })
  @ApiResponse({ status: 201, description: 'Refund successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request (validation errors, etc.).' })
  @ApiResponse({ status: 404, description: 'Invoice, customer, or warehouse not found.' })
  create(@Body() createRefundDto: CreateRefundDto) {
    return this.refundsService.create(createRefundDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all refunds' })
  @ApiResponse({ status: 200, description: 'Return all refunds.' })
  findAll() {
    return this.refundsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a refund by ID' })
  @ApiResponse({ status: 200, description: 'Return the refund.' })
  @ApiResponse({ status: 404, description: 'Refund not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.refundsService.findOne(id);
  }
}

