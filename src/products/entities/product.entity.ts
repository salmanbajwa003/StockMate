import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Fabric } from '../../fabrics/entities/fabric.entity';
import { Color } from '../../colors/entities/color.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  // Clothing-specific fields with relationships
  @ManyToOne(() => Fabric, (fabric) => fabric.products, { eager: true, nullable: true })
  @JoinColumn({ name: 'fabric_id' })
  fabric: Fabric;

  @ManyToOne(() => Color, (color) => color.products, { eager: true, nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ length: 50, nullable: true })
  size: string; // e.g., 'S', 'M', 'L', 'XL', or measurements

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory[];
}
