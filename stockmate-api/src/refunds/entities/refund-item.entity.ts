import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Refund } from './refund.entity';
import { Product } from '../../products/entities/product.entity';
import { UnitType } from '../../common/utils/unit-converter';

@Entity('refund_items')
export class RefundItem extends BaseEntity {
  @ManyToOne(() => Refund, (refund) => refund.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refund_id' })
  refund: Refund;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'integer' })
  originalQuantity: number;

  @Column({ type: 'integer' })
  refundQuantity: number;

  @Column({
    type: 'enum',
    enum: UnitType,
  })
  unit: UnitType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number;
}

