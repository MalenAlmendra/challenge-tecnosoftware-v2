

# Challenge Tecnosotware - Explicación Técnica



## <u>Proceso de desarrollo</u>

Al principio comencé analizando el codigo y haciendo diferentes anotaciones que se pedian dentro de los requisitos.

Comencé reorganizando los dominios funcionales para que hicieran lo que se solicitaba.



Lo que hice fue :

- Modificar los estados a BillinPending ()

- Modificar los estados a Services ()

- Modificar las uniones entre BillingPending e Invoice, para que cumplan el requisito de **"un pendiente solo puede ser facturado una vez"** agregando un @Index({ unique: true }) y cambiando las relaciones @ManyToOne y @OneToMany por @OneToOne
  
  

Luego de estos cambios, el Diagrama de la BBDD quedaría así:

```mermaid
erDiagram
  SERVICES ||--o| BILLING_PENDINGS : "1 service -> 0..1 pending (UNIQUE serviceId)"
  BILLING_PENDINGS ||--|| INVOICES : "1 pending -> 1 invoice (UNIQUE pendingId)"
  BILLING_BATCHES ||--o{ INVOICES : "1 batch -> N invoices"

  SERVICES {
    int id PK
    date serviceDate
    int customerId
    decimal amount
    enum status "PENDING|IN_TRANSIT|DELIVERED|CANCELLED"
    datetime createdAt
    datetime updatedAt
  }

  BILLING_PENDINGS {
    int id PK
    int serviceId FK "-> services.id (UNIQUE)"
    enum status "CREATED|PENDING|SENT_TO_BILL|INVOICED"
    datetime createdAt
    datetime updatedAt
  }

  INVOICES {
    int id PK
    string invoiceNumber
    string cae
    date issueDate
    decimal amount
    int batchId FK "-> billing_batches.id"
    int pendingId FK "-> billing_pendings.id (UNIQUE)"
    datetime createdAt
    datetime updatedAt
  }

  BILLING_BATCHES {
    int id PK
    date issueDate
    string receiptBook
    enum status "PROCESSED|ERROR"
    text errorMessage "nullable"
    datetime createdAt
    datetime updatedAt
  }


```



    

## <u>Creación de la Arquitectura</u>

Al leer detalladamente los requerimientos de la aplicación, elegí hacer la solucion en base a Hexagonal Arquitecture. La decision la tomé porque lo que se quiere es diferenciar dominios entre servicio de logistica y facturación, dentro de la aplicación y esto lo puede solucionar muy facilmente esta arquitectura.


