import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { FabricsService } from '../fabrics/fabrics.service';
import { ColorsService } from '../colors/colors.service';
import { convertToStandardUnit, STANDARD_UNIT } from '../common/utils/unit-converter';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fabricsService: FabricsService,
    private colorsService: ColorsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { fabricId, colorId, weight, unit, ...productData } = createProductDto;

    const product = this.productRepository.create(productData);

    // Set fabric if fabricId is provided
    if (fabricId) {
      product.fabric = await this.fabricsService.findOne(fabricId);
    }

    // Set color if colorId is provided
    if (colorId) {
      product.color = await this.colorsService.findOne(colorId);
    }

    // Convert weight to standard unit (yard) if provided
    if (weight !== undefined && unit) {
      const conversion = convertToStandardUnit(weight, unit);
      product.weight = conversion.value;
      product.unit = conversion.unit;

      // Log conversion for tracking
      if (conversion.conversionApplied) {
        console.log(
          `Unit conversion: ${conversion.originalValue} ${conversion.originalUnit} → ${conversion.value} ${conversion.unit}`,
        );
      }
    } else {
      // Set standard unit if no unit provided
      product.weight = weight;
      product.unit = STANDARD_UNIT;
    }

    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['fabric', 'color'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['fabric', 'color'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { fabricId, colorId, weight, unit, ...productData } = updateProductDto;

    // Update fabric if fabricId is provided
    if (fabricId !== undefined) {
      product.fabric = fabricId ? await this.fabricsService.findOne(fabricId) : null;
    }

    // Update color if colorId is provided
    if (colorId !== undefined) {
      product.color = colorId ? await this.colorsService.findOne(colorId) : null;
    }

    // Convert weight to standard unit (yard) if provided
    if (weight !== undefined && unit) {
      const conversion = convertToStandardUnit(weight, unit);
      product.weight = conversion.value;
      product.unit = conversion.unit;

      // Log conversion for tracking
      if (conversion.conversionApplied) {
        console.log(
          `Unit conversion: ${conversion.originalValue} ${conversion.originalUnit} → ${conversion.value} ${conversion.unit}`,
        );
      }
    } else if (weight !== undefined) {
      product.weight = weight;
    }

    Object.assign(product, productData);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softDelete(id);
  }
}
