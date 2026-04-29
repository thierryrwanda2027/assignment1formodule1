require('dotenv').config();
const { sendEmail } = require('../config/email');
const { welcomeEmail } = require('../templates/emails');

(async () => {
  const name = "NIYONKURU Thierry";
  const email = "niyonkuruthierry37@gmail.com";
  const role = "GUEST";
  const subject = "Welcome to Airbnb!";
  const html = welcomeEmail(name, role);
  
  const result = await sendEmail(email, subject, html);
  if (result.success) {
    console.log("SUCCESS: Test email sent!");
  } else {
    console.error("FAILURE: Could not send test email.", result.error);
  }
})();
