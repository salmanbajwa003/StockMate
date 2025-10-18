import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('colors')
export class Color extends BaseEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 7, nullable: true })
  hexCode: string; // Color hex code like #00FF00

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.color)
  products: Product[];
}
