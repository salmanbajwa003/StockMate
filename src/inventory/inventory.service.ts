import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Inventory } from './entities/inventory.entity';
import { WarehousesService } from '../warehouses/warehouses.service';
import { ProductsService } from '../products/products.service';
import { convertToStandardUnit, STANDARD_UNIT } from '../common/utils/unit-converter';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private warehousesService: WarehousesService,
    private productsService: ProductsService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { warehouseId, productId, quantity, unit, ...inventoryData } = createInventoryDto;

    // Verify warehouse and product exist
    const warehouse = await this.warehousesService.findOne(warehouseId);
    const product = await this.productsService.findOne(productId);

    // Convert quantity to standard unit (yard) if unit is provided
    let convertedQuantity = quantity || 0;
    const inputUnit = unit || product.unit || STANDARD_UNIT;

    if (inputUnit !== STANDARD_UNIT) {
      const conversion = convertToStandardUnit(quantity, inputUnit);
      convertedQuantity = conversion.value;

      console.log(
        `Inventory unit conversion: ${quantity} ${inputUnit} → ${convertedQuantity} ${STANDARD_UNIT}`,
      );
    }

    // Check if inventory already exists for this warehouse-product combination
    const existingInventory = await this.inventoryRepository.findOne({
      where: {
        warehouse: { id: warehouseId },
        product: { id: productId },
      },
    });

    if (existingInventory) {
      // If product already exists in this warehouse, increment the quantity (in yards)
      existingInventory.quantity += convertedQuantity;
      existingInventory.unit = STANDARD_UNIT;
      existingInventory.lastRestockedAt = new Date();

      console.log(
        `Inventory incremented: ${product.name} in ${warehouse.name} - Added ${convertedQuantity} yards, Total: ${existingInventory.quantity} yards`,
      );

      // Update other fields if provided
      if (inventoryData.minimumQuantity !== undefined) {
        existingInventory.minimumQuantity = inventoryData.minimumQuantity;
      }
      if (inventoryData.maximumQuantity !== undefined) {
        existingInventory.maximumQuantity = inventoryData.maximumQuantity;
      }
      if (inventoryData.locationCode !== undefined) {
        existingInventory.locationCode = inventoryData.locationCode;
      }

      return await this.inventoryRepository.save(existingInventory);
    }

    // Create new inventory entry if it doesn't exist (always in yards)
    const inventory = this.inventoryRepository.create({
      ...inventoryData,
      quantity: convertedQuantity,
      unit: STANDARD_UNIT,
      warehouse,
      product,
      lastRestockedAt: new Date(),
    });

    console.log(
      `Inventory created: ${product.name} in ${warehouse.name} - ${convertedQuantity} yards`,
    );

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(warehouseId?: string, productId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.product', 'product');

    if (warehouseId) {
      query.andWhere('warehouse.id = :warehouseId', { warehouseId });
    }

    if (productId) {
      query.andWhere('product.id = :productId', { productId });
    }

    return await query.orderBy('inventory.createdAt', 'DESC').getMany();
  }

  async findLowStock(): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.quantity <= inventory.minimumQuantity')
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse', 'product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    return await this.inventoryRepository.save(inventory);
  }

  async adjustQuantity(id: string, adjustInventoryDto: AdjustInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    const { adjustment, unit, reason } = adjustInventoryDto;

    // Convert adjustment to standard unit (yard) if unit is provided
    let convertedAdjustment = adjustment;
    const inputUnit = unit || STANDARD_UNIT;

    if (inputUnit !== STANDARD_UNIT) {
      const conversion = convertToStandardUnit(Math.abs(adjustment), inputUnit);
      convertedAdjustment = adjustment < 0 ? -conversion.value : conversion.value;

      console.log(
        `Adjustment unit conversion: ${adjustment} ${inputUnit} → ${convertedAdjustment} ${STANDARD_UNIT}`,
      );
    }

    const newQuantity = inventory.quantity + convertedAdjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative quantity. Current: ${inventory.quantity} yards, Adjustment: ${convertedAdjustment} yards`,
      );
    }

    inventory.quantity = newQuantity;
    inventory.unit = STANDARD_UNIT;

    if (convertedAdjustment > 0) {
      inventory.lastRestockedAt = new Date();
    }

    console.log(
      `Inventory adjusted: ${inventory.product.name} - ${convertedAdjustment > 0 ? '+' : ''}${convertedAdjustment} yards${reason ? ` (${reason})` : ''}, New total: ${newQuantity} yards`,
    );

    return await this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.softDelete(id);
  }
}
