import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);

export interface EmailValidationResult {
  isValid: boolean;
  provider: string;
  details: {
    format: boolean;
    mx: boolean;
    dns: boolean;
    spf: boolean;
    mailbox: boolean;
    smtp: boolean;
    helo: boolean;
    [key: string]: any;
  };
}

export async function verifyEmailServer(domain: string): Promise<EmailValidationResult['details']> {
  try {
    // Check MX records
    const mxRecords = await resolveMx(domain);
    const hasMx = mxRecords && mxRecords.length > 0;
    
    if (!hasMx) {
      return {
        format: false,
        mx: false,
        dns: false,
        spf: false,
        mailbox: false,
        smtp: false,
        helo: false
      };
    }

    // Check DNS
    const dnsCheck = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const dnsData = await dnsCheck.json();
    const hasDns = dnsData.Status === 0;

    // Check SPF
    const txtRecords = await resolveTxt(domain);
    const hasSpf = txtRecords.some(records => 
      records.some(record => record.toLowerCase().startsWith('v=spf1'))
    );

    // Sort MX records by priority and get primary mail server
    const mailServer = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
    
    // Check SMTP and HELO
    const { smtp, helo, mailbox } = await new Promise<{smtp: boolean; helo: boolean; mailbox: boolean}>((resolve) => {
      const socket = new net.Socket();
      let response = '';
      
      socket.connect(25, mailServer);
      
      socket.on('data', (data) => {
        response += data.toString();
      });

      socket.on('connect', () => {
        socket.write(`HELO ${domain}\r\n`);
        
        setTimeout(() => {
          const heloSuccess = response.includes('250');
          const smtpSuccess = response.includes('ESMTP');
          const mailboxSuccess = !response.includes('550') && !response.includes('user unknown');
          
          socket.destroy();
          resolve({ 
            smtp: smtpSuccess,
            helo: heloSuccess,
            mailbox: mailboxSuccess
          });
        }, 1000);
      });

      socket.on('error', () => {
        resolve({ smtp: false, helo: false, mailbox: false });
      });

      setTimeout(() => {
        socket.destroy();
        resolve({ smtp: false, helo: false, mailbox: false });
      }, 5000);
    });

    return {
      format: true,
      mx: hasMx,
      dns: hasDns,
      spf: hasSpf,
      mailbox,
      smtp,
      helo
    };
  } catch {
    return {
      format: false,
      mx: false,
      dns: false,
      spf: false,
      mailbox: false,
      smtp: false,
      helo: false
    };
  }
}