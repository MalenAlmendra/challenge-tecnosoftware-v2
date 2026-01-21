export class Invoice {
  invoiceId: number;
  invoiceNumber: string;
  cae: string;
  issueDate: Date;
  amount: number;
  batchId: number;
  pendingId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    invoiceId: number,
    invoiceNumber: string,
    cae: string,
    issueDate: Date,
    amount: number,
    batchId: number,
    pendingId: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.invoiceId = invoiceId;
    this.invoiceNumber = invoiceNumber;
    this.cae = cae;
    this.issueDate = issueDate;
    this.amount = amount;
    this.batchId = batchId;
    this.pendingId = pendingId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
