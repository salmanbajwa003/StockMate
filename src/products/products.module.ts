import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { FabricsModule } from '../fabrics/fabrics.module';
import { ColorsModule } from '../colors/colors.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), FabricsModule, ColorsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
