import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";

// ====== CONFIG ======
const TAG_SUFFIX = " ATH";

// In-memory (per server process) Google access token,
// injected from the signed-in user's session when they hit /api/whatsapp/start.
let currentGoogleAccessToken: string | null = null;

// In-memory guard per server run
const seenThisRun = new Set<string>();

async function saveContactWriteOnly(
  name: string | null | undefined,
  phone: string
) {
  if (!phone) {
    // eslint-disable-next-line no-console
    console.warn("No phone, skipping save");
    return;
  }

  if (!currentGoogleAccessToken) {
    // eslint-disable-next-line no-console
    console.warn(
      "No Google access token from session. User must be signed in before WhatsApp starts."
    );
    return;
  }

  if (seenThisRun.has(phone)) {
    // eslint-disable-next-line no-console
    console.log("Already tried this phone in this run:", phone);
    return;
  }
  seenThisRun.add(phone);

  const taggedName = `${name || phone}${TAG_SUFFIX}`;

  try {
    const res = await fetch(
      "https://people.googleapis.com/v1/people:createContact",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentGoogleAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          names: [{ givenName: taggedName }],
          phoneNumbers: [{ value: phone }],
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-console
      console.error(
        "Failed to save contact (createContact):",
        res.status,
        text
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.log("Saved contact:", taggedName, phone);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("Failed to save contact (network error):", e?.message || e);
  }
}

let client: Client | null = null;
let latestQr: string | null = null;
let state: string = "idle";

export function getStatus() {
  return {
    qr: latestQr,
    state,
  };
}

export function ensureClient(accessTokenFromSession?: string) {
  if (accessTokenFromSession) {
    currentGoogleAccessToken = accessTokenFromSession;
    // eslint-disable-next-line no-console
    console.log(
      "[autosaver] Received Google access token from session. Length:",
      accessTokenFromSession.length
    );
  }

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
    state = "connected";
  });

  client.on("change_state", (s) => {
    state = s || "unknown";
  });

  client.on("disconnected", () => {
    state = "disconnected";
  });

  // Helper to handle any incoming message-like event
  const handleMessage = async (msg: any, source: "message" | "message_create") => {
    try {
      // Log everything so we can see what's coming through
      // eslint-disable-next-line no-console
      console.log("[autosaver] Incoming WhatsApp", source, "event:", {
        from: msg.from,
        to: msg.to,
        fromMe: msg.fromMe,
        isStatus: msg.isStatus,
        type: msg.type,
      });

      // Skip groups only; keep direct chats
      if (typeof msg.from === "string" && msg.from.endsWith("@g.us")) {
        // eslint-disable-next-line no-console
        console.log("[autosaver] Skipping group message from:", msg.from);
        return;
      }

      // Explicitly skip the global status broadcast
      if (msg.from === "status@broadcast") {
        // eslint-disable-next-line no-console
        console.log("[autosaver] Skipping status broadcast");
        return;
      }

      const contact = await msg.getContact();

      const waId =
        (contact.id as any)?._serialized ||
        msg.from ||
        msg.author ||
        msg.to;
      if (!waId) {
        // eslint-disable-next-line no-console
        console.warn("[autosaver] No waId for msg.from =", msg.from);
        return;
      }

      const phone = String(waId).split("@")[0];

      const name =
        (contact as any).pushname ||
        (contact as any).name ||
        (contact as any).shortName ||
        phone;

      // eslint-disable-next-line no-console
      console.log("[autosaver] Resolved contact:", name, phone);

      await saveContactWriteOnly(name, phone);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(
        "[autosaver] Error in message handler:",
        e?.message || e
      );
    }
  };

  // Mirror terminal/index.js: listen for incoming 1‑1 messages and save to Google Contacts
  client.on("message", async (msg) => {
    await handleMessage(msg, "message");
  });

  // Also listen to message_create which sometimes fires more reliably for new messages
  client.on("message_create", async (msg) => {
    await handleMessage(msg, "message_create");
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



