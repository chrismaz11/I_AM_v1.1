import { addCredential, getWallet } from './store.js';
import { buildStoredCredential, createWalletWithKeys } from './cryptoService.js';

export const ensureSeedData = () => {
  const existing = getWallet();
  if (existing) return existing;

  const wallet = createWalletWithKeys({ label: 'I AM Demo Wallet', method: 'key' });
  const sampleCredential = buildStoredCredential(
    {
      name: 'Demo User',
      role: 'Founder',
      proofOfIdentity: 'Level-2 verified',
      issuedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      issuer: 'I AM Org',
      subject: 'Demo User',
      type: ['VerifiableCredential', 'Membership'],
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    },
  );
  addCredential(sampleCredential);
  return wallet;
};
