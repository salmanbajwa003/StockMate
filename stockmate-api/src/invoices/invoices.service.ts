import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CustomersService } from '../customers/customers.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    private customersService: CustomersService,
    private warehousesService: WarehousesService,
    private productsService: ProductsService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const { customerId, warehouseId, items, ...invoiceData } = createInvoiceDto;

    // Verify customer and warehouse exist
    const customer = await this.customersService.findOne(customerId);
    const warehouse = await this.warehousesService.findOne(warehouseId);

    // Validate items and check warehouse availability
    if (!items || items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Create invoice items
    const invoiceItems: InvoiceItem[] = [];

    for (const itemDto of items) {
      const product = await this.productsService.findOne(itemDto.productId);

      // Check warehouse availability
      const productWarehouse = await this.productsService.getProductWarehouse(
        itemDto.productId,
        warehouseId,
      );

      if (!productWarehouse) {
        throw new BadRequestException(`Product ${product.name} is not available in this warehouse`);
      }

      // Validate that the unit matches the product warehouse unit
      if (productWarehouse.unit !== itemDto.unit) {
        throw new BadRequestException(
          `Unit mismatch for product ${product.name}. Product unit in warehouse is ${productWarehouse.unit}, but invoice item unit is ${itemDto.unit}. Unit must match the product's warehouse unit.`,
        );
      }

      if (productWarehouse.quantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient quantity for product ${product.name}. Available: ${productWarehouse.quantity}, Requested: ${itemDto.quantity}`,
        );
      }

      const invoiceItem = this.invoiceItemsRepository.create({
        product,
        quantity: itemDto.quantity,
        unit: itemDto.unit,
        unitPrice: itemDto.unitPrice,
      });

      invoiceItems.push(invoiceItem);
    }

    const paidAmount = invoiceData.paidAmount || 0;
    const total = this.calculateSubtotal(invoiceItems);
    const remainingAmount = total - paidAmount;

    // Determine status based on remaining amount
    // If total equals paid amount, invoice is PAID (Completed), otherwise PENDING
    // Using small epsilon for floating point comparison
    const status =
      Math.abs(remainingAmount) < 0.01 || total === paidAmount
        ? InvoiceStatus.PAID
        : InvoiceStatus.PENDING;

    // Create invoice
    const invoice = this.invoicesRepository.create({
      ...invoiceData,
      customer,
      warehouse,
      total,
      paidAmount,
      status,
      items: invoiceItems,
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // Deduct from warehouse quantities when invoice is created
    await this.deductQuantities(savedInvoice);

    return savedInvoice;
  }

  private calculateItemTotal(item: InvoiceItem): number {
    return item.quantity * item.unitPrice;
  }

  private calculateSubtotal(items: InvoiceItem[]): number {
    return items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
  }

  private async deductQuantities(invoice: Invoice): Promise<void> {
    // Deduct warehouse quantity for each item in the invoice
    for (const item of invoice.items) {
      await this.productsService.adjustQuantity(item.product.id, -item.quantity);
    }
  }

  async findAll(): Promise<Invoice[]> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.warehouse', 'warehouse')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    return await query.orderBy('invoice.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['customer', 'warehouse', 'items', 'items.product'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    // Validate paidAmount doesn't exceed total
    if (updateInvoiceDto.paidAmount !== undefined) {
      const paidAmount = Number(updateInvoiceDto.paidAmount);
      const total = Number(invoice.total);

      if (paidAmount > total) {
        throw new BadRequestException(
          `Paid amount (${paidAmount}) cannot exceed total amount (${total})`,
        );
      }

      invoice.paidAmount = paidAmount;
    }

    if (updateInvoiceDto.notes !== undefined) {
      invoice.notes = updateInvoiceDto.notes;
    }

    // Recalculate status based on paidAmount
    // Total remains unchanged (calculated from items which are not editable)
    const remainingAmount = invoice.total - invoice.paidAmount;
    if (Math.abs(remainingAmount) < 0.01 || invoice.total === invoice.paidAmount) {
      invoice.status = InvoiceStatus.PAID;
    } else {
      invoice.status = InvoiceStatus.PENDING;
    }

    return await this.invoicesRepository.save(invoice);
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    // Restore warehouse quantities before deletion
    for (const item of invoice.items) {
      await this.productsService.adjustQuantity(item.product.id, item.quantity);
    }

    await this.invoicesRepository.softDelete(id);
  }
}
