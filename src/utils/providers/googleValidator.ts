import { z } from 'zod';
import { verifyEmailServer, EmailValidationResult } from './baseValidator';

const googleEmailSchema = z.string().email().refine(
  (email) => email.toLowerCase().endsWith('@gmail.com'),
  { message: 'Not a valid Gmail address' }
);

export const validateGoogleEmail = async (email: string): Promise<EmailValidationResult> => {
  try {
    googleEmailSchema.parse(email);
    
    const [localPart] = email.split('@');
    const isValidFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart);
    const hasDotVariant = localPart.includes('.');
    
    // Verify Gmail servers
    const { helo, smtp } = await verifyEmailServer('gmail.com');
    
    return {
      isValid: isValidFormat && helo && smtp,
      provider: 'google',
      details: {
        format: isValidFormat,
        dotVariant: hasDotVariant,
        helo,
        smtp
      }
    };
  } catch {
    return {
      isValid: false,
      provider: 'google',
      details: {
        format: false,
        dotVariant: false,
        helo: false,
        smtp: false
      }
    };
  }
};