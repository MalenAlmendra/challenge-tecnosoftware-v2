import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AccountingExportStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ERROR = 'ERROR',
}

@Entity('accounting_exports')
export class AccountingExport {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  batchId: number;

  @Column({
    type: 'enum',
    enum: AccountingExportStatus,
    default: AccountingExportStatus.PENDING,
  })
  status: AccountingExportStatus;

  @Column({ type: 'jsonb' })
  payload: unknown;

  @Column({ type: 'text', nullable: true })
  externalRequestId: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
