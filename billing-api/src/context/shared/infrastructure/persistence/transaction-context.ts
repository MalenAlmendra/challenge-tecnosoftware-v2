import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { EntityManager } from 'typeorm';

@Injectable()
export class TransactionContext {
  private readonly storage = new AsyncLocalStorage<EntityManager>();

  run<T>(manager: EntityManager, callback: () => Promise<T>): Promise<T> {
    return this.storage.run(manager, callback);
  }

  getManager(): EntityManager | undefined {
    return this.storage.getStore();
  }
}
