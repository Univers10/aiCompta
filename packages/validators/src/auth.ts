import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SignupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
  organizationName: z.string().min(2, 'Nom trop court').max(100),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const MagicLinkSchema = z.object({
  email: z.string().email('Email invalide'),
});
export type MagicLinkInput = z.infer<typeof MagicLinkSchema>;

export const VerifyTokenSchema = z.object({
  token: z.string().min(20),
});
export type VerifyTokenInput = z.infer<typeof VerifyTokenSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['OWNER', 'ACCOUNTANT', 'VIEWER']),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const SlugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(slugRegex, 'Slug invalide (lettres minuscules, chiffres, tirets)');
