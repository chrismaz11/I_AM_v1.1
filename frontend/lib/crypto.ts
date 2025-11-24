import { createHash, randomBytes } from "node:crypto";

export const hashPayload = (payload: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export const generateShareToken = (expiresAt?: Date) => ({
  token: randomBytes(24).toString("base64url"),
  expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
});
