import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoice_number_sequences')
export class InvoiceNumberSequence {
  @PrimaryColumn()
  receiptBook: string;

  @Column({ type: 'int' })
  nextNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
