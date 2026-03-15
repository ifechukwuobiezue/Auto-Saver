// index.js
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

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

// ===== HELPER: SLEEP =====
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== HELPER: CHECK IF NUMBER ALREADY SAVED =====
async function isNumberSaved(phone) {
  const { data, error } = await supabase
    .from("saved_contacts")
    .select("id")
    .eq("user_email", USER_EMAIL)
    .eq("phone_number", phone)
    .limit(1);

  if (error) console.error("Supabase query error:", error.message || error);

  return data && data.length > 0;
}

// ===== HELPER: GET UNIQUE TAGGED NAME =====
async function getUniqueTaggedName(baseName) {
  const tagged = baseName.endsWith(TAG_SUFFIX)
    ? baseName
    : `${baseName}${TAG_SUFFIX}`;

  const { data } = await supabase
    .from("saved_contacts")
    .select("name")
    .eq("user_email", USER_EMAIL)
    .ilike("name", `${tagged}%`);

  if (!data || data.length === 0) return tagged;

  const existingNames = data.map((r) => r.name);
  if (!existingNames.includes(tagged)) return tagged;

  let counter = 2;
  while (existingNames.includes(`${tagged} ${counter}`)) {
    counter++;
  }
  return `${tagged} ${counter}`;
}

// ===== SAVE CONTACT =====
async function saveContact(name, phone) {
  if (!phone) {
    console.warn("No phone, skipping save");
    return;
  }

  const formattedPhone = phone.startsWith("+") ? phone : "+" + phone;

  console.log("Checking:", formattedPhone, "Name:", name);

  if (await isNumberSaved(formattedPhone)) {
    console.log("Already saved (Supabase):", formattedPhone);
    return;
  }

  const baseName = name || formattedPhone;
  const taggedName = await getUniqueTaggedName(baseName);

  try {
    await people.people.createContact({
      requestBody: {
        names: [{ givenName: taggedName }],
        phoneNumbers: [{ value: formattedPhone }],
      },
    });
    console.log("Saved to Google:", taggedName, formattedPhone);

    const { error } = await supabase.from("saved_contacts").insert([
      {
        user_email: USER_EMAIL,
        phone_number: formattedPhone,
        name: taggedName,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message || error);
    } else {
      console.log("Saved to Supabase:", formattedPhone);
    }
  } catch (e) {
    console.error("Failed to save contact (Google):", e.message || e);
  }
}

// ===== BACKFILL: SCAN ALL CHATS ON STARTUP =====
async function backfillChats(client) {
  console.log("Starting backfill — scanning all chats...");
  const processedThisBackfill = new Set();

  try {
    const chats = await client.getChats();
    const privateChats = chats.filter((c) => !c.isGroup);
    console.log(`Found ${privateChats.length} private chats to scan`);

    let saved = 0;
    let skipped = 0;

    for (const chat of privateChats) {
      try {
        const contact = await chat.getContact();
        if (!contact) continue;

        const waId = contact.id?._serialized;
        if (!waId || waId.includes("@g.us")) continue;

        const phone = "+" + waId.split("@")[0];

        // Skip if already processed in this backfill run
        if (processedThisBackfill.has(phone)) {
          skipped++;
          continue;
        }
        processedThisBackfill.add(phone);

        const alreadySaved = await isNumberSaved(phone);
        if (alreadySaved) {
          skipped++;
          continue;
        }

        const name =
          contact.pushname ||
          contact.name ||
          contact.shortName ||
          phone;

        await saveContact(name, phone);
        saved++;
        await sleep(500);
      } catch (e) {
        console.error("Error processing chat during backfill:", e.message);
      }
    }

    console.log(`Backfill complete — saved: ${saved}, skipped: ${skipped}`);
  } catch (e) {
    console.error("Backfill failed:", e.message || e);
  }
}

// ===== MAIN START FUNCTION =====
async function start() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
      ],
    },
    authTimeoutMs: 120000,
    qrMaxRetries: 5,
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED, scan with your phone:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", async () => {
    console.log("WhatsApp ready! Listening for incoming messages...");
    await backfillChats(client);
  });

  client.on("auth_failure", (msg) => {
    console.error("Auth failure:", msg);
  });

  client.on("disconnected", (reason) => {
    console.error("Client disconnected:", reason);
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
      console.error("Error in message handler:", e.message || e);
    }
  });

  console.log("Initializing WhatsApp client...");
  try {
    await client.initialize();
    console.log("client.initialize() resolved");
  } catch (e) {
    console.error("Error during initialize:", e.message || e);
  }
}

start().catch((e) => {
  console.error("Fatal error starting client:", e);
});
