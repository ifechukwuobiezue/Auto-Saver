const { google } = require("googleapis");
require("dotenv").config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost";

const CODE =
  "4/0AfrIepAT1EwIU8mT0JRJ7GBuiotXY0_B4XbkQjvLsLorTQBjCGVPNf4iSXC0SPfoGjzBXQ";

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
