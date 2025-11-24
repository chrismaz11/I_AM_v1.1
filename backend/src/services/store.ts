import { randomBytes } from 'node:crypto';
import type { Wallet, StoredCredential } from '../../../packages/shared/src/types.js';

interface WalletRecord extends Wallet {
  privateKey: string;
  dataKey: Buffer;
  shareSecret: Buffer;
}

interface DataStore {
  wallet?: WalletRecord;
  credentials: StoredCredential[];
}

const store: DataStore = {
  credentials: [],
};

export const getStore = () => store;

export const setWallet = (wallet: WalletRecord) => {
  store.wallet = wallet;
};

export const getWallet = () => store.wallet;

export const addCredential = (credential: StoredCredential) => {
  store.credentials.push(credential);
};

export const listCredentials = () => store.credentials;

export const findCredential = (id: string) => store.credentials.find((c) => c.meta.id === id);

export const createSecrets = () => ({
  dataKey: randomBytes(32),
  shareSecret: randomBytes(32),
});
