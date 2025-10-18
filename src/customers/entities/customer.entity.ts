import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;
}

