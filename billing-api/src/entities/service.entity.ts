import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BillingPending } from './billing-pending.entity';

// NO deberían incluir estados de facturación (SENT_TO_BILL, INVOICED) porque contamina el dominio
// Los estados de Service deberían ser del dominio de logística (ej: PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
// export enum ServiceStatus {
//   CREATED = 'CREATED',
//   SENT_TO_BILL = 'SENT_TO_BILL',
//   INVOICED = 'INVOICED',
// }
export enum ServiceStatus {
  PENDING = 'PENDING', 
  IN_TRANSIT = 'IN_TRANSIT', 
  DELIVERED = 'DELIVERED', 
  CANCELLED = 'CANCELLED'
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  serviceDate: Date;

  @Column()
  customerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @OneToMany(() => BillingPending, (pending) => pending.service)
  pendings: BillingPending[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

