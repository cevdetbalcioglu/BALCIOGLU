// lib/vault.js
// AES-256-GCM şifreleme/çözme yardımcısı
// VAULT_SECRET env değişkeni: 32 byte hex string
// Oluşturmak için: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.VAULT_SECRET;
  if (!secret) throw new Error('VAULT_SECRET env değişkeni tanımlı değil');
  // 64 hex karakter = 32 byte
  return Buffer.from(secret, 'hex');
}

// Metni şifreler → { encrypted: hex, iv: hex }
export function encrypt(plaintext) {
  if (!plaintext) return { encrypted: '', iv: '' };
  const iv  = crypto.randomBytes(12); // GCM için 12 byte IV
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // tag'i encrypted'ın sonuna ekle (16 byte)
  const combined = Buffer.concat([encrypted, tag]);
  return {
    encrypted: combined.toString('hex'),
    iv: iv.toString('hex'),
  };
}

// Şifreli hex + iv'den metni çözer
export function decrypt(encryptedHex, ivHex) {
  if (!encryptedHex || !ivHex) return '';
  const key       = getKey();
  const iv        = Buffer.from(ivHex, 'hex');
  const combined  = Buffer.from(encryptedHex, 'hex');
  // Son 16 byte auth tag, geri kalanı cipher text
  const tag       = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher  = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}
