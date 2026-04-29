require('dotenv').config();
const { sendEmail } = require('../config/email');
const { welcomeEmail } = require('../templates/emails');

(async () => {
  const name = "NIYONKURU Thierry";
  const email = "niyonkuruthierry37@gmail.com";
  const role = "GUEST";
  const subject = "Welcome to Airbnb!";
  const html = welcomeEmail(name, role);
  try {
    await sendEmail(email, subject, html);
    console.log('Test email sent successfully');
  } catch (err) {
    console.error('Failed to send test email', err);
  }
})();
