import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Refund } from '../../refunds/entities/refund.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Warehouse, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  invoiceDate: Date;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => Refund, (refund) => refund.invoice)
  refunds: Refund[];
}
