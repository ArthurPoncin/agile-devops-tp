import { z } from "zod";

export const listingCreateSchema = z.object({
  title: z.string().trim().min(1, "Titre requis."),
  type: z.enum(["maison", "appartement"], { message: "Type invalide." }),
  city: z.string().trim().min(1, "Ville requise."),
  surface: z.coerce.number().int("Surface entière requise.").positive("Surface doit être > 0."),
  rooms: z.coerce.number().int("Nombre de pièces entier requis.").positive("Nombre de pièces doit être > 0."),
  price: z.coerce.number().int("Prix entier requis.").positive("Prix doit être > 0."),
  description: z.string().trim().max(2000, "Description trop longue (2000 caractères max).").optional(),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;

export const deleteListingSchema = z.object({
  id: z.string().uuid("Identifiant d'annonce invalide."),
});

export type DeleteListingInput = z.infer<typeof deleteListingSchema>;
