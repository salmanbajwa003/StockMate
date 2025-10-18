import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  zipCode: string;

  @Column({ length: 50, nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  capacity: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventory: Inventory[];
}

