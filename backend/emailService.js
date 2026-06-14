const nodemailer = require('nodemailer');

const getTransporter = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be set in your .env file to send emails.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const getFirstName = (fullName = '') => {
  const name = (fullName || '').trim();
  if (!name) return 'Customer';
  return name.split(' ')[0];
};

const personalizeMessage = (template, customer, segment) => {
  const firstName = getFirstName(customer.name);
  return template
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{email\}/gi, customer.email)
    .replace(/\{segment\}/gi, segment || customer.segment || '')
    .replace(/\{campaign_name\}/gi, customer.campaignName || '');
};

const sendBulkEmail = async ({ campaignName, messageTemplate, customers, segment }) => {
  const transporter = getTransporter();

  try {
    await transporter.verify();
  } catch (err) {
    throw new Error(`Email transporter verification failed: ${err.message || err}`);
  }

  const sendOperations = customers.map(customer => {
    const personalizedText = personalizeMessage(messageTemplate, customer, segment);
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: campaignName,
      text: personalizedText,
      html: personalizedText.replace(/\n/g, '<br/>'),
    });
  });

  const results = await Promise.allSettled(sendOperations);
  const sentCount = results.filter(result => result.status === 'fulfilled').length;
  const errors = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason?.message || 'Unknown error');

  if (sentCount === 0) {
    throw new Error(errors[0] || 'No emails were sent');
  }

  return { sentCount, errors };
};

module.exports = {
  sendBulkEmail,
};
