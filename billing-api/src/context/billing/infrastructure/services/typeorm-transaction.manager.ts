import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionManager } from '../../application/ports/services/transaction-manager.port';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmTransactionManager implements TransactionManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {}

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return this.context.run(manager, fn);
    });
  }
}
