import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createShareToken, createWalletWithKeys, decryptPayload, buildStoredCredential, verifyShareToken } from '../services/cryptoService.js';
import { addCredential, findCredential, getWallet, listCredentials } from '../services/store.js';
import type {
  ApiResponse,
  CreateCredentialRequest,
  CreateWalletRequest,
  ShareCredentialRequest,
  VerifyShareRequest,
} from '../../../packages/shared/src/types.js';

const router = Router();

const ensureWallet = () => {
  const wallet = getWallet();
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  return wallet;
};

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } satisfies ApiResponse<unknown>['data'] });
});

router.post('/wallet', (req, res) => {
  try {
    const body = req.body as CreateWalletRequest;
    if (!body?.label || !body?.method) {
      return res.status(400).json({ success: false, error: 'Label and method are required' });
    }
    const wallet = createWalletWithKeys(body);
    const { privateKey, ...safeWallet } = wallet;
    res.json({ success: true, data: safeWallet } satisfies ApiResponse<typeof safeWallet>);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create wallet' });
  }
});

router.get('/wallet', (_req, res) => {
  const wallet = getWallet();
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not created' });
  }
  const { privateKey, ...safeWallet } = wallet;
  res.json({ success: true, data: safeWallet } satisfies ApiResponse<typeof safeWallet>);
});

router.post('/credentials', (req, res) => {
  try {
    const body = req.body as CreateCredentialRequest;
    if (!body?.issuer || !body?.subject || !body?.type || !body?.payload) {
      return res.status(400).json({ success: false, error: 'issuer, subject, type, and payload are required' });
    }
    ensureWallet();
    const id = randomUUID();
    const stored = buildStoredCredential(body.payload, {
      id,
      issuer: body.issuer,
      subject: body.subject,
      type: body.type,
      expiresAt: body.expiresAt,
    });
    addCredential(stored);
    res.status(201).json({ success: true, data: stored.meta } satisfies ApiResponse<typeof stored.meta>);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to store credential' });
  }
});

router.get('/credentials', (_req, res) => {
  const creds = listCredentials().map((c) => c.meta);
  res.json({ success: true, data: creds } satisfies ApiResponse<typeof creds>);
});

router.get('/credentials/:id', (req, res) => {
  try {
    const credential = findCredential(req.params.id);
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    const wallet = ensureWallet();
    const payload = decryptPayload(credential.encryptedPayload, wallet.dataKey);
    res.json({ success: true, data: { meta: credential.meta, payload } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read credential' });
  }
});

router.post('/credentials/:id/share', (req, res) => {
  try {
    const body = req.body as ShareCredentialRequest;
    const credential = findCredential(body.credentialId ?? req.params.id);
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    const expiresAt = new Date(body.expiresAt ?? Date.now() + 1000 * 60 * 10).toISOString();
    const shareToken = createShareToken(credential.meta.id, expiresAt);
    res.json({ success: true, data: shareToken } satisfies ApiResponse<typeof shareToken>);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create share link' });
  }
});

router.post('/verify', (req, res) => {
  try {
    const body = req.body as VerifyShareRequest;
    if (!body?.token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
    const { credentialId, valid, reason } = verifyShareToken(body.token);
    if (!valid) {
      return res.status(400).json({ success: false, error: reason ?? 'Verification failed' });
    }
    const credential = findCredential(credentialId);
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }
    const wallet = ensureWallet();
    const payload = decryptPayload(credential.encryptedPayload, wallet.dataKey);
    res.json({ success: true, data: { meta: credential.meta, payload } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification error' });
  }
});

export const createRouter = () => router;
