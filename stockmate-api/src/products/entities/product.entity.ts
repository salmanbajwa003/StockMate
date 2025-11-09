import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Fabric } from '../../fabrics/entities/fabric.entity';
import { Color } from '../../colors/entities/color.entity';
import { ProductWarehouse } from './product-warehouse.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @ManyToOne(() => Fabric, (fabric) => fabric.products, { eager: true, nullable: false })
  @JoinColumn({ name: 'fabric_id' })
  fabric: Fabric;

  @ManyToOne(() => Color, (color) => color.products, { eager: true, nullable: false })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @OneToMany(() => ProductWarehouse, (productWarehouse) => productWarehouse.product, {
    cascade: true,
  })
  productWarehouses: ProductWarehouse[];
}
