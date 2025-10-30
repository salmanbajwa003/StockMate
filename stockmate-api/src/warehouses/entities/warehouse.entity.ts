import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductWarehouse } from '../../products/entities/product-warehouse.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 50, nullable: true })
  size: string;

  @OneToMany(() => ProductWarehouse, (productWarehouse) => productWarehouse.warehouse, {
    cascade: true,
  })
  productWarehouses: ProductWarehouse[];
}
