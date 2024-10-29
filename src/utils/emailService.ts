import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendValidationResults = async (
  to: string,
  csvBuffer: Buffer,
  totalEmails: number,
  validEmails: number
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'Email Validation Results',
    text: `
      Your email validation results are ready!
      
      Summary:
      - Total emails processed: ${totalEmails}
      - Valid emails: ${validEmails}
      - Invalid emails: ${totalEmails - validEmails}
      
      The complete results are attached to this email.
    `,
    attachments: [
      {
        filename: 'email_validation_results.csv',
        content: csvBuffer,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};