import 'reflect-metadata';
import dataSource from '../config/ormconfig';
import { Service, ServiceStatus } from '../entities/service.entity';
import { BillingPending, PendingStatus } from '../entities/billing-pending.entity';
import { BillingBatch, BatchStatus } from '../entities/billing-batch.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceNumberSequence } from '../entities/invoice-sequence.entity';

async function seed() {
  await dataSource.initialize();

  const serviceRepo = dataSource.getRepository(Service);
  const pendingRepo = dataSource.getRepository(BillingPending);
  const batchRepo = dataSource.getRepository(BillingBatch);
  const invoiceRepo = dataSource.getRepository(Invoice);
  const sequenceRepo = dataSource.getRepository(InvoiceNumberSequence);

  const existing = await serviceRepo.count();
  if (existing > 0) {
    await dataSource.destroy();
    return;
  }

  const services = await serviceRepo.save([
    serviceRepo.create({
      serviceDate: new Date('2024-01-10'),
      customerId: 101,
      amount: 1200,
      status: ServiceStatus.DELIVERED,
    }),
    serviceRepo.create({
      serviceDate: new Date('2024-01-11'),
      customerId: 101,
      amount: 900,
      status: ServiceStatus.DELIVERED,
    }),
    serviceRepo.create({
      serviceDate: new Date('2024-01-12'),
      customerId: 202,
      amount: 1500,
      status: ServiceStatus.DELIVERED,
    }),
    serviceRepo.create({
      serviceDate: new Date('2024-01-13'),
      customerId: 303,
      amount: 500,
      status: ServiceStatus.IN_TRANSIT,
    }),
  ]);

  const pendings = await pendingRepo.save([
    pendingRepo.create({
      serviceId: services[0].id,
      status: PendingStatus.PENDING,
    }),
    pendingRepo.create({
      serviceId: services[1].id,
      status: PendingStatus.INVOICED,
    }),
    pendingRepo.create({
      serviceId: services[2].id,
      status: PendingStatus.PENDING,
    }),
    pendingRepo.create({
      serviceId: services[3].id,
      status: PendingStatus.SENT_TO_BILL,
    }),
  ]);

  const batch = await batchRepo.save(
    batchRepo.create({
      issueDate: new Date('2024-02-01'),
      receiptBook: 'A',
      status: BatchStatus.PROCESSED,
      errorMessage: null,
    }),
  );

  await invoiceRepo.save(
    invoiceRepo.create({
      invoiceNumber: 'A-00000001',
      cae: 'CAE-SEED-0001',
      issueDate: new Date('2024-02-01'),
      amount: services[1].amount,
      batchId: batch.id,
      pendingId: pendings[1].id,
    }),
  );

  await sequenceRepo.save(
    sequenceRepo.create({
      receiptBook: 'A',
      nextNumber: 2,
    }),
  );

  await dataSource.destroy();
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Seed error', error);
  await dataSource.destroy();
  process.exit(1);
});
