import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from "typeorm";
import { BillingBatch } from "./billing-batch.entity";
import { BillingPending } from "./billing-pending.entity";

@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceNumber: string;

  @Column()
  cae: string;

  @Column({ type: "date" })
  issueDate: Date;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  batchId: number;

  @ManyToOne(() => BillingBatch, (batch) => batch.invoices)
  @JoinColumn({ name: "batchId" })
  batch: BillingBatch;

  //un pendiente solo puede ser facturado una vez
  @Index({ unique: true })
  @Column()
  pendingId: number;

  @OneToOne(() => BillingPending, (pending) => pending.invoices, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "pendingId" })
  pending: BillingPending;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
