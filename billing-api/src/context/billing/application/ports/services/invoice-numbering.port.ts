export interface InvoiceNumbering {
  /** Devuelve el próximo número correlativo para un talonario */
  nextInvoiceNumber(receiptBook: string, quantity: number): Promise<string[]>;
}
