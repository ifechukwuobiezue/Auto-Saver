// index.js
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { google } = require('googleapis');

// ====== CONFIG ======
const TAG_SUFFIX = ' HUB';
const CLIENT_ID = '';
const CLIENT_SECRET = '';
const REDIRECT_URI = 'http://localhost';
const REFRESH_TOKEN = '';
// ====================

// Google Contacts setup
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const people = google.people({ version: 'v1', auth: oauth2Client });

// In‑memory guard
const seenThisRun = new Set();

async function saveContactWriteOnly(name, phone) {
  if (!phone) {
    console.warn('No phone, skipping save');
    return;
  }

  if (seenThisRun.has(phone)) {
    console.log('Already tried this phone in this run:', phone);
    return;
  }
  seenThisRun.add(phone);

  const taggedName = `${name || phone}${TAG_SUFFIX}`;

  try {
    await people.people.createContact({
      requestBody: {
        names: [{ givenName: taggedName }],
        phoneNumbers: [{ value: phone }],
      },
    });
    console.log('Saved contact:', taggedName, phone);
  } catch (e) {
    console.error('Failed to save contact (createContact):', e.message || e);
  }
}

// ===== WHATSAPP CLIENT (NO OLD CHAT SCAN) =====
const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => qrcode.generate(qr, { small: true }));

client.on('ready', () => {
  console.log('WhatsApp ready! Listening for *incoming* messages only…');
});

// Only incoming 1‑1 messages
client.on('message', async (msg) => {
  try {
    if (msg.from.includes('@g.us') || msg.isStatus) return;
    if (msg.fromMe) return;

    const contact = await msg.getContact();

    const waId = contact.id?._serialized || msg.from;
    if (!waId) {
      console.warn('No waId for msg.from =', msg.from);
      return;
    }

    const phone = waId.split('@')[0];

    const name =
      contact.pushname ||
      contact.name ||
      contact.shortName ||
      phone;

    await saveContactWriteOnly(name, phone);
  } catch (e) {
    console.error('Error in message handler:', e.message || e);
  }
});

client.initialize();