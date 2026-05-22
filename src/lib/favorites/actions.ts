"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(listingId: string, isFavorite: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté pour ajouter un favori." };
  }

  if (isFavorite) {
    // Si déjà en favori, on le supprime
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) return { error: "Impossible de retirer des favoris." };
  } else {
    // Sinon, on l'ajoute
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, listing_id: listingId });

    if (error) return { error: "Impossible d'ajouter aux favoris." };
  }

  // On force la revalidation des pages pour rafraîchir l'état visuel du bouton
  revalidatePath("/annonces");
  revalidatePath("/favoris");
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}