import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InvoiceNumbering } from '../../application/ports/services/invoice-numbering.port';
import { InvoiceNumberSequence } from '../../../../entities/invoice-sequence.entity';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmInvoiceNumberingService implements InvoiceNumbering {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {}

  async nextInvoiceNumber(receiptBook: string, quantity: number): Promise<string[]> {
    const manager = this.context.getManager() ?? this.dataSource.manager;

    const repo = manager.getRepository(InvoiceNumberSequence);
    let sequence = await repo
      .createQueryBuilder('seq')
      .setLock('pessimistic_write')
      .where('seq.receiptBook = :receiptBook', { receiptBook })
      .getOne();

    if (!sequence) {
      sequence = repo.create({ receiptBook, nextNumber: 1 });
      sequence = await repo.save(sequence);
    }

    const start = sequence.nextNumber;
    const end = sequence.nextNumber + quantity;

    sequence.nextNumber = end;
    await repo.save(sequence);

    const numbers: string[] = [];
    for (let i = start; i < end; i += 1) {
      numbers.push(this.formatNumber(receiptBook, i));
    }

    return numbers;
  }

  private formatNumber(receiptBook: string, sequence: number): string {
    const suffix = sequence.toString().padStart(8, '0');
    return `${receiptBook}-${suffix}`;
  }
}
