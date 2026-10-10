require('dotenv').config();
const { cloudinary } = require('./src/config/cloudinary');
const sendEmail = require('./src/utils/emailService');

(async () => {
  try {
    console.log('Testing Cloudinary Connection...');
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connected successfully!', result);
  } catch (error) {
    console.error('Cloudinary connection failed:', error.message);
  }

  try {
    console.log('\nTesting Nodemailer Configuration...');
    const emailToTest = process.env.EMAIL_USER; // sending to self for testing
    if (!emailToTest) {
      console.log('No EMAIL_USER found in .env, skipping email test.');
      return;
    }
    await sendEmail(emailToTest, 'Test Email from OmniMart', 'This is a test email verifying Nodemailer and Gmail SMTP.');
    console.log('Test email sent successfully! Check your inbox.');
  } catch (error) {
    console.error('Nodemailer test failed:', error.message);
  }
})();
