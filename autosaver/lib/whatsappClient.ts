import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";

let client: Client | null = null;
let latestQr: string | null = null;
let state: string = "idle";

export function getStatus() {
  return {
    qr: latestQr,
    state,
  };
}

export function ensureClient() {
  if (client) {
    return client;
  }

  state = "starting";

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(process.cwd(), ".wwebjs_auth"),
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    latestQr = qr;
    state = "qr";
  });

  client.on("ready", () => {
    latestQr = null;
    state = "ready";
  });

  client.on("change_state", (s) => {
    state = s || "unknown";
  });

  client.on("disconnected", () => {
    state = "disconnected";
  });

  client
    .initialize()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("WhatsApp client initialized");
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("WhatsApp init error:", err);
      state = "error";
    });

  return client;
}

