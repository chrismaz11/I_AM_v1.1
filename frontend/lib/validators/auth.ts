import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2).max(64),
});
