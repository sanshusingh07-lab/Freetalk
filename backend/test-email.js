import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { sendOtpEmail } from './src/services/emailService.js';

dotenv.config();

const recipient = process.argv[2] || process.env.SMTP_USER;

console.log('==============================================');
console.log('  FreeTalk Email Dispatcher Self-Test');
console.log('==============================================');
console.log('Current Configuration:');
console.log('  SMTP_HOST  :', process.env.SMTP_HOST || '(not set - using dev console mode)');
console.log('  SMTP_PORT  :', process.env.SMTP_PORT || '(not set)');
console.log('  SMTP_USER  :', process.env.SMTP_USER || '(not set)');
console.log('  SMTP_PASS  :', process.env.SMTP_PASS ? '********' : '(not set)');
console.log('  EMAIL_FROM :', process.env.EMAIL_FROM || '"FreeTalk Security" <notifications@freetalk.internal>');
console.log('----------------------------------------------');

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n⚠️  No SMTP credentials found in backend/.env!');
  console.log('The backend is currently in DEV MODE (codes are printed to the terminal console).');
  console.log('\nTo send real emails to inboxes:');
  console.log('1. Use any Gmail account (e.g. freetalk.team@gmail.com or your personal Gmail)');
  console.log('2. Generate a 16-character Google App Password (https://myaccount.google.com/apppasswords)');
  console.log('3. Add them to backend/.env:');
  console.log('   SMTP_HOST="smtp.gmail.com"');
  console.log('   SMTP_PORT=465');
  console.log('   SMTP_SECURE=true');
  console.log('   SMTP_USER="your-email@gmail.com"');
  console.log('   SMTP_PASS="xxxx xxxx xxxx xxxx"');
  console.log('   EMAIL_FROM="FreeTalk <your-email@gmail.com>"');
  process.exit(0);
}

if (!recipient) {
  console.log('Please provide a recipient email to test:');
  console.log('  node test-email.js someone@gmail.com');
  process.exit(1);
}

console.log(`Sending test OTP email to: ${recipient}...`);

const testCode = String(Math.floor(100000 + Math.random() * 900000));

sendOtpEmail({ to: recipient, code: testCode, purpose: 'LOGIN' })
  .then((res) => {
    if (res.success) {
      console.log('✅ SUCCESS! Email sent successfully to', recipient);
      console.log('Check your inbox (and Spam folder) for the 6-digit code:', testCode);
    } else {
      console.error('❌ FAILED to send email:', res.error);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  });
