export type DIDMethod = 'key' | 'ion' | 'web';

export interface Wallet {
  id: string;
  label: string;
  did: string;
  method: DIDMethod;
  createdAt: string;
  publicKey: string;
}

export interface CredentialMeta {
  id: string;
  issuer: string;
  subject: string;
  type: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
  hash: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface StoredCredential {
  meta: CredentialMeta;
  encryptedPayload: EncryptedPayload;
}

export interface VerificationRequest {
  requestId: string;
  credentialId: string;
  verifier: string;
  purpose: string;
  createdAt: string;
}

export interface VerificationResult {
  requestId: string;
  valid: boolean;
  checkedAt: string;
  reason?: string;
}

export interface ShareToken {
  token: string;
  credentialId: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateWalletRequest {
  label: string;
  method: DIDMethod;
}

export interface CreateCredentialRequest {
  issuer: string;
  subject: string;
  type: string[];
  payload: Record<string, unknown>;
  expiresAt?: string;
}

export interface ShareCredentialRequest {
  credentialId: string;
  expiresAt: string;
}

export interface VerifyShareRequest {
  token: string;
}
