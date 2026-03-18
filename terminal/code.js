const { google } = require("googleapis");
require("dotenv").config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost";

const CODE =
  "4/0AfrIepD3ZhqM7c3awS8-LsaUwvyjqlkijxKBaSkkhZTc_3bIvK66fkdQCfbhAv5atnxo1A";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function getToken() {
  const { tokens } = await oauth2Client.getToken(CODE);
  console.log(tokens);
}

getToken();
