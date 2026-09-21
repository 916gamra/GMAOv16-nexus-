// vaultService.js - Coffre-fort Chiffré Zero-Knowledge
// Architecture : Master PIN = Clé cryptographique unique (PBKDF2 100 000 itérations + AES-256-GCM)
// Données au repos chiffrées sans aucun mot de passe ni sel statique stocké dans le code source.

const VAULT_SALT_KEY = 'gmao_vault_salt_v2';
const VAULT_CIPHER_KEY = 'gmao_vault_cipher_v2';
const VAULT_IV_KEY = 'gmao_vault_iv_v2';
const VAULT_PIN_HASH_KEY = 'gmao_vault_pin_hash_v2';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

// Génération aléatoire d'un sel cryptographique dynamique (non présent dans le code)
export function generateRandomSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToBase64(salt);
}

export function getOrCreateSalt() {
  let saltB64 = localStorage.getItem(VAULT_SALT_KEY);
  if (!saltB64) {
    saltB64 = generateRandomSalt();
    localStorage.setItem(VAULT_SALT_KEY, saltB64);
  }
  return saltB64;
}

// Dérivation de clé AES-256-GCM depuis le PIN + Sel via PBKDF2 (100 000 itérations SHA-256)
export async function deriveKeyFromPin(pin, saltB64) {
  const saltBuf = base64ToBuf(saltB64);
  const pinKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: 100000,
      hash: 'SHA-256',
    },
    pinKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return aesKey;
}

// Chiffrement intégral du coffre en AES-256-GCM
export async function encryptVault(vaultObject, pin) {
  const saltB64 = getOrCreateSalt();
  const key = await deriveKeyFromPin(pin, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 octets standards pour AES-GCM
  const dataBuf = enc.encode(JSON.stringify(vaultObject));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuf
  );
  const cipherB64 = bufToBase64(cipherBuf);
  const ivB64 = bufToBase64(iv);
  localStorage.setItem(VAULT_CIPHER_KEY, cipherB64);
  localStorage.setItem(VAULT_IV_KEY, ivB64);
  return { cipherB64, ivB64, saltB64 };
}

// Déchiffrement du coffre-fort : échec si Master PIN invalide
export async function decryptVault(pin) {
  const cipherB64 = localStorage.getItem(VAULT_CIPHER_KEY);
  const ivB64 = localStorage.getItem(VAULT_IV_KEY);
  const saltB64 = localStorage.getItem(VAULT_SALT_KEY);
  if (!cipherB64 || !ivB64 || !saltB64) {
    throw new Error('Le coffre-fort est inexistant. Veuillez d\'abord définir un Master PIN.');
  }
  const key = await deriveKeyFromPin(pin, saltB64);
  const cipherBuf = base64ToBuf(cipherB64);
  const ivBuf = new Uint8Array(base64ToBuf(ivB64));
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuf },
      key,
      cipherBuf
    );
    const json = dec.decode(plainBuf);
    return JSON.parse(json);
  } catch {
    throw new Error('Master PIN incorrect ou échec du déchiffrement du coffre-fort (AES-256-GCM).');
  }
}

export function isVaultExists() {
  return !!localStorage.getItem(VAULT_CIPHER_KEY);
}

// Hachage SHA-256 du PIN pour validation rapide
export async function hashPinSHA256(pin) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(pin));
  return bufToBase64(buf);
}

export async function setPinHash(pin) {
  const hash = await hashPinSHA256(pin);
  localStorage.setItem(VAULT_PIN_HASH_KEY, hash);
  return hash;
}

export async function verifyPinHash(pin) {
  const stored = localStorage.getItem(VAULT_PIN_HASH_KEY);
  if (!stored) return true;
  const hash = await hashPinSHA256(pin);
  return hash === stored;
}

export function createEmptyVault() {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    accounts: [],
  };
}

export const vaultService = {
  generateRandomSalt,
  getOrCreateSalt,
  deriveKeyFromPin,
  encryptVault,
  decryptVault,
  isVaultExists,
  hashPinSHA256,
  setPinHash,
  verifyPinHash,
  createEmptyVault,
  bufToBase64,
  base64ToBuf,
};

export default vaultService;
