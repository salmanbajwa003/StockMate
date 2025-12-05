import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductWarehouse } from './entities/product-warehouse.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { FabricsService } from '../fabrics/fabrics.service';
import { ColorsService } from '../colors/colors.service';
import { convertProductUnit } from '../common/utils/unit-converter';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductWarehouse)
    private productWarehouseRepository: Repository<ProductWarehouse>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    private fabricsService: FabricsService,
    private colorsService: ColorsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { fabricId, colorId, warehouseQuantities, ...productData } = createProductDto;

    const product = this.productRepository.create(productData);

    // Set fabric (required)
    product.fabric = await this.fabricsService.findOne(fabricId);

    // Set color (required)
    product.color = await this.colorsService.findOne(colorId);

    // Save product first to get ID
    const savedProduct = await this.productRepository.save(product);

    // Validate warehouse quantities (required)
    if (!warehouseQuantities || warehouseQuantities.length === 0) {
      throw new BadRequestException('At least one warehouse quantity is required');
    }

    const warehouseIds = warehouseQuantities.map((wq) => wq.warehouseId);
    const warehouses = await this.warehouseRepository.find({
      where: { id: In(warehouseIds) },
    });

    if (warehouses.length !== warehouseIds.length) {
      throw new NotFoundException('One or more warehouses not found');
    }

    // Create ProductWarehouse entries with conversions
    const productWarehouses = warehouseQuantities.map((wq) => {
      const warehouse = warehouses.find((w) => w.id === wq.warehouseId);

      // Apply conversion rules: Meter → Yard, Yard → Yard, Kg → Kg
      const conversion = convertProductUnit(wq.quantity, wq.unit);

      // Log conversion for tracking
      if (conversion.conversionApplied) {
        console.log(
          `[${warehouse.name}] Unit conversion: ${conversion.originalValue} ${conversion.originalUnit} → ${conversion.value} ${conversion.unit}`,
        );
      }

      return this.productWarehouseRepository.create({
        product: savedProduct,
        warehouse,
        quantity: conversion.value,
        unit: conversion.unit,
      });
    });

    await this.productWarehouseRepository.save(productWarehouses);

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['fabric', 'color', 'productWarehouses', 'productWarehouses.warehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['fabric', 'color', 'productWarehouses', 'productWarehouses.warehouse'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { fabricId, colorId, warehouseQuantities, ...productData } = updateProductDto;

    // Update fabric if fabricId is provided
    if (fabricId !== undefined) {
      product.fabric = fabricId ? await this.fabricsService.findOne(fabricId) : null;
    }

    // Update color if colorId is provided
    if (colorId !== undefined) {
      product.color = colorId ? await this.colorsService.findOne(colorId) : null;
    }

    // Update warehouse quantities if provided
    if (warehouseQuantities !== undefined) {
      // Remove existing warehouse associations
      await this.productWarehouseRepository.delete({ product: { id } });

      // Add new warehouse associations
      if (warehouseQuantities.length > 0) {
        const warehouseIds = warehouseQuantities.map((wq) => wq.warehouseId);
        const warehouses = await this.warehouseRepository.find({
          where: { id: In(warehouseIds) },
        });

        if (warehouses.length !== warehouseIds.length) {
          throw new NotFoundException('One or more warehouses not found');
        }

        // Create ProductWarehouse entries with conversions
        warehouseQuantities.forEach((wq) => {
          const warehouse = warehouses.find((w) => w.id === wq.warehouseId);

          // Apply conversion rules: Meter → Yard, Yard → Yard, Kg → Kg
          const conversion = convertProductUnit(wq.quantity, wq.unit);

          // Log conversion for tracking
          if (conversion.conversionApplied) {
            console.log(
              `[${warehouse.name}] Unit conversion: ${conversion.originalValue} ${conversion.originalUnit} → ${conversion.value} ${conversion.unit}`,
            );
          }

          return this.productWarehouseRepository.update(
            { product: { id } },
            {
              warehouse,
              quantity: conversion.value,
              unit: conversion.unit,
            },
          );
        });
      }
    }

    Object.assign(product, productData);
    await this.productRepository.save(product);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softDelete(id);
  }

  // Warehouse quantity management methods
  async getProductWarehouse(
    productId: number,
    warehouseId: number,
  ): Promise<ProductWarehouse | null> {
    return await this.productWarehouseRepository.findOne({
      where: {
        product: { id: productId },
        warehouse: { id: warehouseId },
      },
      relations: ['product', 'warehouse'],
    });
  }

  async checkAvailability(
    productId: number,
    warehouseId: number,
    requiredQuantity: number,
  ): Promise<boolean> {
    const productWarehouse = await this.getProductWarehouse(productId, warehouseId);

    if (!productWarehouse) {
      return false;
    }

    return productWarehouse.quantity >= requiredQuantity;
  }

  async adjustQuantity(productId: number, adjustment: number): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    await this.productRepository.update(
      { id: productId },
      {
        weight: product.weight - adjustment,
      },
    );
  }
}
