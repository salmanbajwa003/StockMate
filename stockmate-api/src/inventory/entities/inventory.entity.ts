import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory')
@Index(['warehouse', 'product'], { unique: true })
export class Inventory extends BaseEntity {
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Product, (product) => product.inventory, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantity: number;

  @Column({ length: 20, default: 'yard' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'minimum_quantity' })
  minimumQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'maximum_quantity' })
  maximumQuantity: number;

  @Column({ length: 50, nullable: true, name: 'location_code' })
  locationCode: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_restocked_at' })
  lastRestockedAt: Date;
}
