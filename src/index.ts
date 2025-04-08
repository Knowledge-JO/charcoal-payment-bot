import dotenv from "dotenv";
import { Markup, Telegraf } from "telegraf";
import cron from "node-cron";

import { updateInvoiceStatus } from "./controllers/invoice";
import { paymentSuccessful } from "./controllers/paymentReceipt";
import { connect } from "./db/connectDB";
import { keepAlive } from "./lib/utils";

dotenv.config();

const port = Number(process.env.PORT) || 8080;
const token = process.env.TG_BOT_TOKEN || "";

const NGROK_URL = process.env.LOCAL_WEBHOOK_URL || ""; // change to yours
const MAIN_URL = process.env.WEBHOOK_URL || "";

const MINI_APP = process.env.MINI_APP_URL || "";

const URL = process.env.PRODUCTION == "true" ? MAIN_URL : NGROK_URL;

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  const text = ctx.message.text; // Access the text property directly
  const textList = text.split(" ");
  const referralId = textList.length > 1 ? textList[1] : undefined;
  const link = `${MINI_APP}?${referralId ? `referralId=${referralId}` : ""}`;
  console.log(link, referralId);
  const keyboard = [[Markup.button.webApp("Launch", link)]];

  try {
    const imagePath =
      "https://indigo-absolute-stork-664.mypinata.cloud/ipfs/bafybeigkc6e77j4pfgrkk3mbhqtyff4pt5rg3w3l3uzzcyjsiyqc6dmzcy";

    await ctx.replyWithPhoto(imagePath, {
      caption: `Hello ${ctx.message.from.first_name}`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.log("Error reply user", error);
  }
});

bot.on("successful_payment", async (ctx) => {
  const successfulPayment = ctx.message.successful_payment;
  const { telegram_payment_charge_id, invoice_payload, total_amount } =
    successfulPayment;
  const userId = ctx.from.id;
  const payload = JSON.parse(invoice_payload);

  try {
    await paymentSuccessful(
      {
        invoiceId: payload.invoiceId,
        item: payload.item,
        itemQuantity: payload.itemQuantity,
      },
      telegram_payment_charge_id,
      userId,
      total_amount
    );
    await updateInvoiceStatus(payload.invoiceId, "success");
    ctx.sendMessage(`payment of ${total_amount} stars was successful ✅`);
  } catch (error) {
    ctx.sendMessage(`Error making payment: ${(error as Error).message}`);
    console.log("Error making payment", error);
  }
});

async function init() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Error connecting to DB. uri not defined");
  await connect(uri);
  console.log("DB connected...");
  bot
    .launch({
      webhook: {
        domain: URL,
        port,
      },
    })
    .then(() => console.log("Webhook bot listening on port", port));
}

init();

cron.schedule("*/5 * * * *", () => {
  keepAlive("");
  console.log("Pinging the server every 5 minutes");
});
