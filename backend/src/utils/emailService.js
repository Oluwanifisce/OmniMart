const nodemailer = require('nodemailer');

// Configure Nodemailer transporter for Gmail
// NOTE: Do NOT set host/port/secure when using service:'gmail' — those override
// Gmail's known-good settings and cause ETIMEDOUT on Vercel serverless functions.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Reusable function to send transactional emails
 * Includes anti-spam headers and dual HTML + plain-text format for maximum inbox deliverability.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text    - Plain text fallback body (required — spam filters flag HTML-only)
 * @param {string} html    - HTML body (optional, falls back to text)
 */
const sendEmail = async (to, subject, text, html = '') => {
  try {
    const mailOptions = {
      from: `"OmniMart Core Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      // Plain-text fallback is MANDATORY — spam filters auto-flag HTML-only emails
      text: text || 'This is a transactional email from OmniMart. Please do not reply.',
      // HTML body — falls back to plain text wrapper if not provided
      html: html || `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">${text}</div>`,
      // Anti-spam transactional priority headers
      // These prove authenticity to Gmail, Yahoo, and Outlook inbox firewalls
      headers: {
        'X-Priority': '1',           // High-priority transactional mail
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'OmniMart Transactional Mailer v2.0',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to} | Subject: "${subject}" | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to} | Subject: "${subject}":`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;
