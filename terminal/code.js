const { google } = require('googleapis');

const CLIENT_ID = "";
const CLIENT_SECRET = "";
const REDIRECT_URI = "http://localhost";

const CODE = "";

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

