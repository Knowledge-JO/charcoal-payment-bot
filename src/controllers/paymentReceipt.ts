import Invoice from "../models/Invoice";
import PaymentReceipt from "../models/PaymentReceipt";

type Payload = {
  itemQuantity: number;
  item: string;
  invoiceId: string;
};

async function paymentSuccessful(
  payload: Payload,
  paymentId: string,
  userId: number,
  amount: number
) {
  const invoice = await Invoice.findOne({ requestId: payload.invoiceId });

  if (!invoice)
    throw new Error(`Invoice with id-[${payload.invoiceId}] does not exist`);

  const paymentReceipt = await PaymentReceipt.create({
    invoiceId: payload.invoiceId,
    transactionId: paymentId,
    userId,
    amount,
    item: {
      item: payload.item,
      itemQuantity: payload.itemQuantity,
    },
  });

  return paymentReceipt;
}

export { paymentSuccessful };
