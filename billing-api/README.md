# Billing API - Sistema de Facturación por Lote

Backend en NestJS + TypeORM para facturación manual por lotes. Incluye integración con PostgreSQL, autenticación (Cognito o mock) y flujo de exportación contable simulado.

---

## 🚀 Inicio Rápido (Docker)

1. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```

2. **Levantar todo (DB + migraciones + seeds + API)**
   ```bash
   docker compose up --build
   ```

3. **Verificar salud**
   ```bash
   curl http://localhost:3057/health
   ```

4. **Login (mock)**
   ```bash
   curl -X POST http://localhost:3057/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

5. **Swagger**
   - http://localhost:3057/api

---

## 🧠 Decisiones de Modelado

- **Logística vs Billing**: `Service` (logística) NO incluye estados de facturación. La facturación vive en `BillingPending`, `BillingBatch` e `Invoice`.
- **Relaciones**:
  - `Service (logística)` → `BillingPending` (1 a N)
  - `BillingPending` → `Invoice` (1 a 1)
  - `BillingBatch` → `Invoice` (1 a N)
- **Batch manual**: el lote se ejecuta manualmente con `issueDate` + `receiptBook`.
- **CAE simulado**: se genera localmente con un identificador simple.

---

## 🔒 Concurrencia & Idempotencia

Estrategia mínima implementada:

- **Lock de pendings**: durante el procesamiento del batch se hace `SELECT ... FOR UPDATE` para evitar que dos usuarios facturen el mismo pending.
- **Constraint único**: `Invoice.pendingId` tiene índice único, evita duplicados.
- **Secuencia por talonario**: tabla `invoice_number_sequences` con locking pesimista para numeración correlativa por `receiptBook`.
- **Estado de batch**: si falla, queda en `ERROR` con mensaje.

---

## 📦 Alcance Implementado

- Endpoints de pendings, batches, invoices y exports contables.
- Guard + modo `MOCK_AUTH=true` (JWT local o user mock).
- Validaciones DTO con `class-validator`.
- Migraciones + seeds en Docker Compose.
- Filtro global de errores `{ code, message, details?, correlationId? }`.

---

## 🔁 Formato de Datos para Sync Contable

Ejemplo resumido (ver endpoint `/accounting/exports/:batchId`):

```json
{
  "exportVersion": "1.0",
  "generatedAt": "2024-02-01T10:00:00.000Z",
  "batch": {
    "id": 10,
    "issueDate": "2024-02-01",
    "receiptBook": "A",
    "status": "PROCESSED"
  },
  "documents": [
    {
      "externalRef": "BATCH-10-INVOICE-55",
      "docType": "INVOICE",
      "invoiceNumber": "A-00000055",
      "cae": "CAE-ABC123",
      "issueDate": "2024-02-01",
      "customer": { "id": 101 },
      "totals": {
        "currency": "ARS",
        "netAmount": 1200,
        "taxAmount": 0,
        "totalAmount": 1200
      },
      "items": [
        {
          "lineNumber": 1,
          "description": "Logistics service 777",
          "quantity": 1,
          "unitPrice": 1200,
          "netAmount": 1200,
          "references": {
            "serviceId": 777,
            "serviceDate": "2024-01-10",
            "pendingId": 999
          }
        }
      ]
    }
  ]
}
```

Campos clave:
- `externalRef`: idempotencia en ERP.
- `receiptBook` y `invoiceNumber`: trazabilidad por talonario.
- `references`: trazabilidad con logística.

---

## 🗄️ Migraciones y Seeds

### Scripts

```bash
npm run db:migrate
npm run db:seed
```

### Qué incluyen

- **Clientes simulados** vía `customerId` en `services`.
- **Servicios facturables** con distintos estados.
- **Billing pendings** en distintos estados.
- **1 batch procesado** + invoices asociadas.
- **Secuencia de numeración** inicial.

---

## ✅ Variables de Entorno Relevantes

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=billing_challenge

PORT=3000
NODE_ENV=development

MOCK_AUTH=true
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Cognito (modo real)
COGNITO_JWKS_URI=
COGNITO_ISSUER=
COGNITO_AUDIENCE=
```

---

## 🧩 Mejoras Futuras

- Cola real (SQS/BullMQ) con retries configurables.
- Estados adicionales para batch (`IN_PROGRESS`, `QUEUED`).
- Auditoría y trazabilidad con `correlationId`.
- Integración Cognito real con scopes/roles.
- Tests e2e + contract tests de export contable.

