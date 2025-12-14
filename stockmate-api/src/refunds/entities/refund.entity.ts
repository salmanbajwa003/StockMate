import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { RefundItem } from './refund-item.entity';

@Entity('refunds')
export class Refund extends BaseEntity {
  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Invoice, { eager: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Warehouse, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalRefundAmount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @OneToMany(() => RefundItem, (item) => item.refund, { cascade: true })
  items: RefundItem[];
}

