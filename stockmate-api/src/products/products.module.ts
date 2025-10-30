import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductWarehouse } from './entities/product-warehouse.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { FabricsModule } from '../fabrics/fabrics.module';
import { ColorsModule } from '../colors/colors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductWarehouse, Warehouse]),
    FabricsModule,
    ColorsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
