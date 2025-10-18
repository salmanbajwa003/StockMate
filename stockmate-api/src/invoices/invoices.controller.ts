import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from './entities/invoice.entity';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request (insufficient inventory, etc.).' })
  @ApiResponse({ status: 409, description: 'Invoice number already exists.' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiResponse({ status: 200, description: 'Return all invoices.' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.findAll(customerId, warehouseId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Return the invoice.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice successfully updated.' })
  @ApiResponse({ status: 400, description: 'Cannot update paid/cancelled invoice.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid.' })
  @ApiResponse({ status: 400, description: 'Invoice already paid or cancelled.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled.' })
  @ApiResponse({ status: 400, description: 'Cannot cancel paid invoice.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an invoice (soft delete)' })
  @ApiResponse({ status: 204, description: 'Invoice successfully deleted.' })
  @ApiResponse({ status: 400, description: 'Cannot delete paid invoice.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}

