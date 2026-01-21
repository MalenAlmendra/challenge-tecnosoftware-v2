import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBillingEnumsAndExports1700000001000 implements MigrationInterface {
  name = 'UpdateBillingEnumsAndExports1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update service_status_enum to align with logistics domain (no billing states)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status_enum') THEN
          CREATE TYPE service_status_enum_new AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
          ALTER TABLE services
            ALTER COLUMN "status" TYPE service_status_enum_new
            USING (
              CASE
                WHEN "status"::text IN ('CREATED', 'SENT_TO_BILL', 'INVOICED') THEN 'PENDING'::service_status_enum_new
                ELSE 'PENDING'::service_status_enum_new
              END
            );
          DROP TYPE service_status_enum;
          ALTER TYPE service_status_enum_new RENAME TO service_status_enum;
        ELSE
          CREATE TYPE service_status_enum AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') THEN
          ALTER TABLE services ALTER COLUMN "status" SET DEFAULT 'PENDING';
        END IF;
      END $$;
    `);

    // Update pending_status_enum to include all billing pending states
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pending_status_enum') THEN
          CREATE TYPE pending_status_enum_new AS ENUM ('CREATED', 'PENDING', 'SENT_TO_BILL', 'INVOICED');
          ALTER TABLE billing_pendings
            ALTER COLUMN "status" TYPE pending_status_enum_new
            USING (
              CASE
                WHEN "status"::text = 'INVOICED' THEN 'INVOICED'::pending_status_enum_new
                WHEN "status"::text = 'PENDING' THEN 'PENDING'::pending_status_enum_new
                ELSE 'PENDING'::pending_status_enum_new
              END
            );
          DROP TYPE pending_status_enum;
          ALTER TYPE pending_status_enum_new RENAME TO pending_status_enum;
        ELSE
          CREATE TYPE pending_status_enum AS ENUM ('CREATED', 'PENDING', 'SENT_TO_BILL', 'INVOICED');
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_pendings' AND column_name = 'status') THEN
          ALTER TABLE billing_pendings ALTER COLUMN "status" SET DEFAULT 'PENDING';
        END IF;
      END $$;
    `);

    // Ensure unique invoice per pending
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_invoices_pending_unique'
        ) THEN
          CREATE UNIQUE INDEX "IDX_invoices_pending_unique" ON "invoices" ("pendingId");
        END IF;
      END $$;
    `);

    // Sequence table for invoice numbering per receipt book
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_number_sequences" (
        "receiptBook" VARCHAR NOT NULL,
        "nextNumber" INTEGER NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoice_number_sequences" PRIMARY KEY ("receiptBook")
      )
    `);

    // Accounting exports table (outbox)
    const exportEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'accounting_export_status_enum'
      )
    `);

    if (!exportEnumExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "accounting_export_status_enum" AS ENUM('PENDING', 'SENT', 'ERROR')
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accounting_exports" (
        "id" SERIAL NOT NULL,
        "batchId" INTEGER NOT NULL,
        "status" "accounting_export_status_enum" NOT NULL DEFAULT 'PENDING',
        "payload" JSONB NOT NULL,
        "externalRequestId" TEXT,
        "errorMessage" TEXT,
        "sentAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounting_exports" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounting_exports_batchId" ON "accounting_exports" ("batchId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounting_exports_batchId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounting_exports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accounting_export_status_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_number_sequences"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_pending_unique"`);
    // NOTE: We don't revert enum changes to avoid data loss.
  }
}
