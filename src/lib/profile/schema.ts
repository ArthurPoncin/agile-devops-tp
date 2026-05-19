import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nom requis.")
    .max(120, "Nom trop long (120 caractères max)."),
  email: z
    .string()
    .min(1, "Email requis.")
    .email("Format d'email invalide."),
  phone: z
    .string()
    .trim()
    .max(20, "Téléphone trop long (20 caractères max).")
    .regex(/^[0-9+\-\s().]*$/, "Numéro de téléphone invalide.")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
