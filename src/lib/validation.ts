import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[0-9]/, "Must include a number");

export const emailSchema = z.string().email("Invalid email");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dot, underscore, hyphen");

export const roleSchema = z.enum([
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const signupBaseSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  role: roleSchema,
});

export const signupUnderwriterSchema = signupBaseSchema.extend({
  specialtyLine: z.string().min(1, "Select your specialty"),
  yearsExp: z.coerce.number().int().min(0),
});

export const signupBrokerSchema = signupBaseSchema.extend({
  organization: z.string().min(1, "Enter organization"),
});

export const signupInsurerSchema = signupBaseSchema.extend({
  organization: z.string().min(1, "Enter company name"),
  industry: z.string().optional(),
});

export const signupClaimsSchema = signupBaseSchema.extend({
  organization: z.string().min(1, "Enter organization"),
  avgClaimsPerMonth: z.coerce.number().int().min(0),
});

export const signupReinsurerSchema = signupBaseSchema.extend({
  organization: z.string().min(1, "Enter reinsurer"),
  reinsurerType: z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => ["treaty", "facultative"].includes(val), {
      message: "Invalid reinsurer type",
    }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
