import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email requis.").email("Format d'email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Nom requis."),
    email: z.string().min(1, "Email requis.").email("Format d'email invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .regex(/[a-zA-Z]/, "Le mot de passe doit contenir au moins une lettre.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "La confirmation ne correspond pas au mot de passe.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
