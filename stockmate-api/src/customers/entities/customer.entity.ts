import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 150, unique: true, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true })
  phone_number2: string;

  @Column({ length: 20, nullable: true })
  phone_number3: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  driver_name: string;

  @Column({ length: 100, nullable: true })
  vehicle_make: string;

  @Column({ length: 50, nullable: true })
  driver_no: string;

  @Column({ length: 50, nullable: true })
  vehicle_number: string;
}
