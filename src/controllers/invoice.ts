import Invoice, { StatusType } from "../models/Invoice";

async function updateInvoiceStatus(invoiceId: string, status: StatusType) {
  const invoice = await Invoice.findOne({ requestId: invoiceId });

  if (!invoice) throw new Error(`Invoice with id[${invoiceId}] does not exist`);
  await invoice.updateOne({
    status,
  });
}

export { updateInvoiceStatus };
