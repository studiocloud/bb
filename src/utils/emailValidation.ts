import { z } from 'zod';
import { validateGoogleEmail } from './providers/googleValidator';
import { validateOutlookEmail } from './providers/outlookValidator';
import { verifyEmailServer } from './providers/baseValidator';

const emailSchema = z.string().email();

interface ValidationResult {
  syntax: boolean;
  mx: boolean;
  dns: boolean;
  spf: boolean;
  mailbox: boolean;
  smtp: boolean;
  helo: boolean;
  isValid: boolean;
  provider?: {
    name: string;
    details: Record<string, any>;
  };
}

export const validateEmail = async (email: string): Promise<ValidationResult> => {
  const result: ValidationResult = {
    syntax: false,
    mx: false,
    dns: false,
    spf: false,
    mailbox: false,
    smtp: false,
    helo: false,
    isValid: false
  };

  try {
    // Basic syntax validation
    emailSchema.parse(email);
    result.syntax = true;

    // Extract domain
    const domain = email.split('@')[1].toLowerCase();
    
    // Provider-specific validation
    if (domain === 'gmail.com') {
      const googleResult = await validateGoogleEmail(email);
      result.provider = {
        name: 'google',
        details: googleResult.details
      };
      result.isValid = googleResult.isValid;
      Object.assign(result, googleResult.details);
    } else if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) {
      const outlookResult = await validateOutlookEmail(email);
      result.provider = {
        name: 'outlook',
        details: outlookResult.details
      };
      result.isValid = outlookResult.isValid;
      Object.assign(result, outlookResult.details);
    } else {
      // Generic email validation
      const details = await verifyEmailServer(domain);
      Object.assign(result, details);
      
      // For generic emails, consider valid if MX, DNS, and SPF pass
      // SMTP failure doesn't invalidate the email
      result.isValid = result.mx && result.dns && result.spf;
    }

    return result;
  } catch (error) {
    console.error('Validation error:', error);
    return {
      ...result,
      isValid: false
    };
  }
};