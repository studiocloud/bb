import { z } from 'zod';
import { verifyEmailServer, EmailValidationResult } from './baseValidator';

const outlookEmailSchema = z.string().email().refine(
  (email) => {
    const domain = email.split('@')[1].toLowerCase();
    return ['outlook.com', 'hotmail.com', 'live.com'].includes(domain);
  },
  { message: 'Not a valid Outlook address' }
);

export const validateOutlookEmail = async (email: string): Promise<EmailValidationResult> => {
  try {
    outlookEmailSchema.parse(email);
    
    const [localPart, domain] = email.split('@');
    const isValidFormat = /^[a-zA-Z0-9._-]+$/.test(localPart);
    
    // Verify Outlook servers
    const { helo, smtp } = await verifyEmailServer(domain);
    
    return {
      isValid: isValidFormat && helo && smtp,
      provider: 'outlook',
      details: {
        format: isValidFormat,
        helo,
        smtp
      }
    };
  } catch {
    return {
      isValid: false,
      provider: 'outlook',
      details: {
        format: false,
        helo: false,
        smtp: false
      }
    };
  }
};