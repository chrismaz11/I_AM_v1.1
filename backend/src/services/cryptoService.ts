import { createCipheriv, createDecipheriv, createHmac, createHash, generateKeyPairSync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createSecrets, getWallet, setWallet } from './store.js';
import type { CreateWalletRequest, EncryptedPayload, ShareToken, StoredCredential, Wallet } from '../../../packages/shared/src/types.js';

const toBase64Url = (data: Buffer) => data.toString('base64url');
const fromBase64Url = (data: string) => Buffer.from(data, 'base64url');

export const createWalletWithKeys = ({ label, method }: CreateWalletRequest): Wallet => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pub = publicKey.export({ type: 'spki', format: 'der' });
  const priv = privateKey.export({ type: 'pkcs8', format: 'der' });
  const did = `did:key:${toBase64Url(pub)}`;
  const { dataKey, shareSecret } = createSecrets();

  setWallet({
    id: randomUUID(),
    label,
    method,
    did,
    createdAt: new Date().toISOString(),
    publicKey: toBase64Url(pub),
    privateKey: toBase64Url(priv),
    dataKey,
    shareSecret,
  });

  return getWallet()!;
};

export const encryptPayload = (payload: Record<string, unknown>, key: Buffer): EncryptedPayload => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: toBase64Url(ciphertext),
    iv: toBase64Url(iv),
    tag: toBase64Url(tag),
  };
};

export const decryptPayload = (encrypted: EncryptedPayload, key: Buffer): Record<string, unknown> => {
  const decipher = createDecipheriv('aes-256-gcm', key, fromBase64Url(encrypted.iv));
  decipher.setAuthTag(fromBase64Url(encrypted.tag));
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(encrypted.ciphertext)),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8'));
};

export const hashObject = (payload: Record<string, unknown>) => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(payload));
  return hash.digest('hex');
};

export const buildStoredCredential = (
  payload: Record<string, unknown>,
  meta: Omit<StoredCredential['meta'], 'hash' | 'status' | 'updatedAt' | 'createdAt'>,
): StoredCredential => {
  const wallet = getWallet();
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  const now = new Date().toISOString();
  const encryptedPayload = encryptPayload(payload, wallet.dataKey);
  const hash = hashObject(payload);
  return {
    meta: {
      ...meta,
      hash,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    encryptedPayload,
  };
};

export const createShareToken = (credentialId: string, expiresAt: string): ShareToken => {
  const wallet = getWallet();
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  const payload = `${credentialId}.${expiresAt}`;
  const sig = createHmac('sha256', wallet.shareSecret).update(payload).digest('base64url');
  const token = Buffer.from(JSON.stringify({ credentialId, expiresAt, sig }), 'utf8').toString('base64url');
  return { token, credentialId, expiresAt };
};

export const verifyShareToken = (token: string): { credentialId: string; valid: boolean; reason?: string } => {
  const wallet = getWallet();
  if (!wallet) {
    return { credentialId: '', valid: false, reason: 'Wallet not initialized' };
  }
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { credentialId: string; expiresAt: string; sig: string };
    const payload = `${parsed.credentialId}.${parsed.expiresAt}`;
    const expectedSig = createHmac('sha256', wallet.shareSecret).update(payload).digest('base64url');
    if (!timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expectedSig))) {
      return { credentialId: parsed.credentialId, valid: false, reason: 'Invalid signature' };
    }
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      return { credentialId: parsed.credentialId, valid: false, reason: 'Share token expired' };
    }
    return { credentialId: parsed.credentialId, valid: true };
  } catch (err) {
    return { credentialId: '', valid: false, reason: 'Malformed token' };
  }
};
