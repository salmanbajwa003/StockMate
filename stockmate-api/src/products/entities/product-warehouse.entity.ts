import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { UnitType } from '../../common/utils/unit-converter';

@Entity('product_warehouses')
export class ProductWarehouse extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.productWarehouses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.productWarehouses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: UnitType,
  })
  unit: UnitType;
}
