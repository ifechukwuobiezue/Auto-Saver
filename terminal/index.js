const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const chromium = require("@sparticuz/chromium");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("INDEX.JS STARTED, ENV RENDER =", process.env.RENDER);

// ===== CONFIG =====
const TAG_SUFFIX = " ATH";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// ===== SUPABASE SETUP =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const USER_EMAIL = "theathenahubs@gmail.com";

// ===== GOOGLE CONTACTS SETUP =====
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const people = google.people({ version: "v1", auth: oauth2Client });

// ===== IN-MEMORY GUARD =====
const seenThisRun = new Set();

async function isNumberSaved(phone) {
  if (seenThisRun.has(phone)) return true;

  const { data, error } = await supabase
    .from("saved_contacts")
    .select("id")
    .eq("user_email", USER_EMAIL)
    .eq("phone_number", phone)
    .limit(1);

  if (error) console.error("Supabase query error:", error.message || error);

  return data && data.length > 0;
}

async function saveContact(name, phone) {
  if (!phone) {
    console.warn("No phone, skipping save");
    return;
  }

  const formattedPhone = phone.startsWith("+") ? phone : "+" + phone;
  console.log("Incoming message from:", formattedPhone, "Name:", name);

  if (await isNumberSaved(formattedPhone)) {
    console.log("Already saved (Supabase):", formattedPhone);
    return;
  }

  seenThisRun.add(formattedPhone);
  const taggedName = `${name || formattedPhone}${TAG_SUFFIX}`;

  try {
    await people.people.createContact({
      requestBody: {
        names: [{ givenName: taggedName }],
        phoneNumbers: [{ value: formattedPhone }],
      },
    });
    console.log("✅ Saved contact to Google:", taggedName, formattedPhone);

    const { error } = await supabase.from("saved_contacts").insert([
      {
        user_email: USER_EMAIL,
        phone_number: formattedPhone,
        name: taggedName,
      },
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message || error);
    } else {
      console.log("✅ Saved contact to Supabase:", formattedPhone);
    }
  } catch (e) {
    console.error("❌ Failed to save contact (Google):", e.message || e);
  }
}

async function start() {
  const isRender = process.env.RENDER === "true";
  console.log("isRender =", isRender, "NODE_ENV =", process.env.NODE_ENV);

  let puppeteerConfig;

  try {
    if (isRender) {
      const execPath = await chromium.executablePath();
      console.log("chromium.executablePath() returned:", execPath);

      puppeteerConfig = {
        executablePath: execPath,
        headless: chromium.headless,
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      };
    } else {
      puppeteerConfig = { headless: true };
    }
  } catch (e) {
    console.error("❌ Error computing puppeteerConfig:", e.message || e);
    puppeteerConfig = { headless: true };
  }

  console.log("Puppeteer config ready");

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerConfig,
    authTimeoutMs: 120000,
    qrMaxRetries: 5,
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED, scan with your phone:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("WhatsApp ready! Listening for incoming messages…");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Auth failure:", msg);
  });

  client.on("disconnected", (reason) => {
    console.error("❌ Client disconnected:", reason);
  });

  client.on("message", async (msg) => {
    try {
      if (msg.from.includes("@g.us") || msg.isStatus) return;
      if (msg.fromMe) return;

      const contact = await msg.getContact();
      const waId = contact.id?._serialized || msg.from;
      if (!waId) return console.warn("No waId for msg.from =", msg.from);

      const phone = "+" + waId.split("@")[0];
      const name =
        contact.pushname ||
        contact.name ||
        contact.shortName ||
        phone;

      await saveContact(name, phone);
    } catch (e) {
      console.error("❌ Error in message handler:", e.message || e);
    }
  });

  console.log("Initializing WhatsApp client…");
  try {
    await client.initialize();
    console.log("client.initialize() resolved");
  } catch (e) {
    console.error("❌ Error during initialize:", e.message || e);
  }
}

start().catch((e) => {
  console.error("Fatal error starting client:", e);
});
