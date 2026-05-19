import { z } from "zod";

export const deleteListingSchema = z.object({
  id: z.string().uuid("Identifiant d'annonce invalide."),
});

export type DeleteListingInput = z.infer<typeof deleteListingSchema>;
