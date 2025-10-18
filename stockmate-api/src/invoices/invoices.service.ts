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
import { InventoryService } from '../inventory/inventory.service';

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
    private inventoryService: InventoryService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const { customerId, warehouseId, items, ...invoiceData } = createInvoiceDto;

    // Verify customer and warehouse exist
    const customer = await this.customersService.findOne(customerId);
    const warehouse = await this.warehousesService.findOne(warehouseId);

    // Check if invoice number already exists
    const existingInvoice = await this.invoicesRepository.findOne({
      where: { invoiceNumber: createInvoiceDto.invoiceNumber },
    });

    if (existingInvoice) {
      throw new ConflictException(
        `Invoice with number ${createInvoiceDto.invoiceNumber} already exists`,
      );
    }

    // Validate items and check inventory availability
    if (!items || items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Calculate totals
    let subtotal = 0;
    const invoiceItems: InvoiceItem[] = [];

    for (const itemDto of items) {
      const product = await this.productsService.findOne(itemDto.productId);

      // Check inventory availability
      const inventoryList = await this.inventoryService.findAll(warehouseId, itemDto.productId);

      if (inventoryList.length === 0) {
        throw new BadRequestException(`Product ${product.name} is not available in this warehouse`);
      }

      const inventory = inventoryList[0];
      if (inventory.quantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for product ${product.name}. Available: ${inventory.quantity}, Requested: ${itemDto.quantity}`,
        );
      }

      const itemTotal = itemDto.quantity * itemDto.unitPrice - (itemDto.discount || 0);
      subtotal += itemTotal;

      const invoiceItem = this.invoiceItemsRepository.create({
        product,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        discount: itemDto.discount || 0,
        total: itemTotal,
        notes: itemDto.notes,
      });

      invoiceItems.push(invoiceItem);
    }

    const taxAmount = (subtotal * (invoiceData.taxRate || 0)) / 100;
    const total = subtotal + taxAmount - (invoiceData.discount || 0);

    // Create invoice
    const invoice = this.invoicesRepository.create({
      ...invoiceData,
      customer,
      warehouse,
      subtotal,
      taxAmount,
      total,
      items: invoiceItems,
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // If invoice is not draft, deduct from inventory
    if (savedInvoice.status !== InvoiceStatus.DRAFT) {
      await this.deductInventory(savedInvoice);
    }

    return savedInvoice;
  }

  private async deductInventory(invoice: Invoice): Promise<void> {
    // Deduct inventory for each item in the invoice
    // Note: All quantities are in yards (standard unit) as per the unit conversion system
    for (const item of invoice.items) {
      const inventoryList = await this.inventoryService.findAll(
        invoice.warehouse.id,
        item.product.id,
      );

      if (inventoryList.length > 0) {
        // Deduct the quantity in yards (item.quantity is already in yards from product)
        await this.inventoryService.adjustQuantity(inventoryList[0].id, {
          adjustment: -item.quantity,
          unit: 'yard', // Explicitly specify yard for clarity
          reason: `Invoice ${invoice.invoiceNumber}`,
        });

        console.log(
          `Invoice deduction: ${item.product.name} - Deducted ${item.quantity} yards for invoice ${invoice.invoiceNumber}`,
        );
      }
    }
  }

  async findAll(
    customerId?: string,
    warehouseId?: string,
    status?: InvoiceStatus,
  ): Promise<Invoice[]> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.warehouse', 'warehouse')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (customerId) {
      query.andWhere('customer.id = :customerId', { customerId });
    }

    if (warehouseId) {
      query.andWhere('warehouse.id = :warehouseId', { warehouseId });
    }

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    return await query.orderBy('invoice.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['customer', 'warehouse', 'items', 'items.product'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled invoice');
    }

    // Update basic fields
    Object.assign(invoice, updateInvoiceDto);

    // Recalculate if tax rate or discount changed
    if (updateInvoiceDto.taxRate !== undefined || updateInvoiceDto.discount !== undefined) {
      invoice.taxAmount = (invoice.subtotal * (invoice.taxRate || 0)) / 100;
      invoice.total = invoice.subtotal + invoice.taxAmount - (invoice.discount || 0);
    }

    return await this.invoicesRepository.save(invoice);
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already marked as paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot mark a cancelled invoice as paid');
    }

    const wasPending = invoice.status === InvoiceStatus.PENDING;

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // If it was pending, inventory was already deducted
    // If it was draft, deduct now
    if (!wasPending) {
      await this.deductInventory(savedInvoice);
    }

    return savedInvoice;
  }

  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        'Cannot cancel a paid invoice. Please create a refund instead.',
      );
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    // If inventory was deducted (status was pending), restore it
    if (invoice.status === InvoiceStatus.PENDING) {
      for (const item of invoice.items) {
        const inventoryList = await this.inventoryService.findAll(
          invoice.warehouse.id,
          item.product.id,
        );

        if (inventoryList.length > 0) {
          await this.inventoryService.adjustQuantity(inventoryList[0].id, {
            adjustment: item.quantity,
            reason: `Invoice ${invoice.invoiceNumber} cancelled`,
          });
        }
      }
    }

    invoice.status = InvoiceStatus.CANCELLED;
    return await this.invoicesRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    // If pending, restore inventory before deletion
    if (invoice.status === InvoiceStatus.PENDING) {
      await this.cancel(id);
    }

    await this.invoicesRepository.softDelete(id);
  }
}
