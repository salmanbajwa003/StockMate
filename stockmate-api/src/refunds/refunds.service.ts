import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRefundDto } from './dto/create-refund.dto';
import { Refund } from './entities/refund.entity';
import { RefundItem } from './entities/refund-item.entity';
import { CustomersService } from '../customers/customers.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(RefundItem)
    private refundItemsRepository: Repository<RefundItem>,
    private customersService: CustomersService,
    private warehousesService: WarehousesService,
    private invoicesService: InvoicesService,
    private productsService: ProductsService,
  ) {}

  async create(createRefundDto: CreateRefundDto): Promise<Refund> {
    const {
      invoiceId,
      invoiceNumber,
      customerId,
      warehouseId,
      refundItems,
      reason,
      totalRefundAmount,
    } = createRefundDto;

    // Verify customer, warehouse, and invoice exist
    const customer = await this.customersService.findOne(customerId);
    const warehouse = await this.warehousesService.findOne(warehouseId);
    const invoice = await this.invoicesService.findOne(invoiceId);

    // Validate invoice number matches
    if (invoice.invoiceNumber !== invoiceNumber) {
      throw new BadRequestException(
        `Invoice number mismatch. Expected: ${invoice.invoiceNumber}, Provided: ${invoiceNumber}`,
      );
    }

    // Validate refund items
    if (!refundItems || refundItems.length === 0) {
      throw new BadRequestException('Refund must have at least one item');
    }

    // Validate refund items against invoice items
    const invoiceItemMap = new Map(invoice.items.map((item) => [item.id, item]));

    const refundItemsEntities: RefundItem[] = [];

    for (const refundItemDto of refundItems) {
      const invoiceItem = invoiceItemMap.get(refundItemDto.itemId);

      if (!invoiceItem) {
        throw new NotFoundException(
          `Invoice item with ID ${refundItemDto.itemId} not found in invoice`,
        );
      }

      // Validate product matches
      if (invoiceItem.product.id !== refundItemDto.productId) {
        throw new BadRequestException(
          `Product mismatch for item ${refundItemDto.itemId}. Expected: ${invoiceItem.product.id}, Provided: ${refundItemDto.productId}`,
        );
      }

      // Validate refund quantity doesn't exceed original quantity
      if (refundItemDto.refundQuantity > refundItemDto.originalQuantity) {
        throw new BadRequestException(
          `Refund quantity (${refundItemDto.refundQuantity}) cannot exceed original quantity (${refundItemDto.originalQuantity}) for item ${refundItemDto.itemId}`,
        );
      }

      // Validate refund quantity doesn't exceed invoice item quantity
      if (refundItemDto.refundQuantity > invoiceItem.quantity) {
        throw new BadRequestException(
          `Refund quantity (${refundItemDto.refundQuantity}) cannot exceed invoice item quantity (${invoiceItem.quantity}) for item ${refundItemDto.itemId}`,
        );
      }

      // Get product to verify it exists
      const product = await this.productsService.findOne(refundItemDto.productId);

      // Create refund item entity
      const refundItem = this.refundItemsRepository.create({
        product,
        originalQuantity: refundItemDto.originalQuantity,
        refundQuantity: refundItemDto.refundQuantity,
        unit: refundItemDto.unit,
        unitPrice: refundItemDto.unitPrice,
        refundAmount: refundItemDto.refundAmount,
      });

      refundItemsEntities.push(refundItem);
    }

    // Validate total refund amount matches sum of item refund amounts
    const calculatedTotal = refundItems.reduce((sum, item) => sum + Number(item.refundAmount), 0);

    if (Math.abs(calculatedTotal - totalRefundAmount) > 0.01) {
      throw new BadRequestException(
        `Total refund amount mismatch. Calculated: ${calculatedTotal}, Provided: ${totalRefundAmount}`,
      );
    }

    // Create refund
    const refund = this.refundsRepository.create({
      customer,
      invoice,
      warehouse,
      totalRefundAmount,
      reason: reason || null,
      items: refundItemsEntities,
    });

    const savedRefund = await this.refundsRepository.save(refund);

    // Add quantities back to warehouse inventory
    await this.restoreQuantities(savedRefund);

    return this.findOne(savedRefund.id);
  }

  private async restoreQuantities(refund: Refund): Promise<void> {
    // Add warehouse quantity for each refund item
    for (const item of refund.items) {
      // Get ProductWarehouse to validate unit matches
      const productWarehouse = await this.productsService.getProductWarehouse(
        item.product.id,
        refund.warehouse.id,
      );

      if (!productWarehouse) {
        throw new NotFoundException(
          `Product ${item.product.id} is not available in warehouse ${refund.warehouse.id}`,
        );
      }

      // Validate unit matches (refund unit should match ProductWarehouse unit)
      if (item.unit !== productWarehouse.unit) {
        throw new BadRequestException(
          `Unit mismatch for product ${item.product.id}. Refund unit: ${item.unit}, Warehouse unit: ${productWarehouse.unit}`,
        );
      }

      // Add the refund quantity back to warehouse inventory
      await this.productsService.adjustWarehouseQuantity(
        item.product.id,
        refund.warehouse.id,
        item.refundQuantity,
      );
    }
  }

  async findAll(): Promise<Refund[]> {
    return await this.refundsRepository.find({
      relations: ['customer', 'invoice', 'warehouse', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Refund> {
    const refund = await this.refundsRepository.findOne({
      where: { id },
      relations: ['customer', 'invoice', 'warehouse', 'items', 'items.product'],
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    return refund;
  }
}
