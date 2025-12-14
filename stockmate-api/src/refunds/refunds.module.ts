import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Refund } from './entities/refund.entity';
import { RefundItem } from './entities/refund-item.entity';
import { CustomersModule } from '../customers/customers.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, RefundItem]),
    CustomersModule,
    WarehousesModule,
    InvoicesModule,
    ProductsModule,
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}

