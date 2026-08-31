import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Ensure the encryption key is exactly 32 bytes for aes-256-cbc
const getKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || 'default_secret_key_that_is_long_';
  if (Buffer.from(secret).length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes long');
  }
  return Buffer.from(secret);
};

export const encrypt = (text: string): string => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: iv:encryptedData
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    // Return as-is if it's not in the expected format (e.g. for existing plaintext passwords in db before this feature)
    return encryptedText;
  }
  
  const [ivHex, encryptedData] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed, falling back to original string', error);
    return encryptedText; // Fallback in case of wrong key or tampering
  }
};
