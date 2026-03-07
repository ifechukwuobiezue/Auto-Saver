const { google } = require('googleapis');

const CLIENT_ID = "";
const CLIENT_SECRET = "";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/contacts']
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);