import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Service } from './service.entity';
import { Invoice } from './invoice.entity';

//La información de facturación debe estar en BillingPending
export enum PendingStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SENT_TO_BILL = 'SENT_TO_BILL',
  INVOICED = 'INVOICED',
}

@Entity('billing_pendings')
export class BillingPending {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serviceId: number;

  @ManyToOne(() => Service, (service) => service.pendings)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({
    type: 'enum',
    enum: PendingStatus,
    default: PendingStatus.PENDING,
  })
  status: PendingStatus;

  @OneToOne(() => Invoice, (invoice) => invoice.pending)
  invoices: Invoice;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

