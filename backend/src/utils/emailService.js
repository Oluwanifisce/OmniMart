const nodemailer = require('nodemailer');

// Configure Nodemailer transporter optimized for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Reusable function to send transactional emails
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email body
 * @param {string} html - HTML email body (optional)
 */
const sendEmail = async (to, subject, text, html = '') => {
  try {
    const mailOptions = {
      from: `"OmniMart Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text, // Fallback to text if HTML isn't provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;
