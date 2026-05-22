"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(listingId: string, formData: FormData) {
  const supabase = await createClient();

  // On récupère l'utilisateur connecté s'il existe (optionnel selon votre schéma)
  const { data: { user } } = await supabase.auth.getUser();

  const buyerName = formData.get("buyerName") as string;
  const buyerEmail = formData.get("buyerEmail") as string;
  const content = formData.get("content") as string;

  if (!buyerName || !buyerEmail || !content) {
    return { error: "Tous les champs sont obligatoires." };
  }

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    buyer_id: user?.id ?? null, // Reste null si l'utilisateur n'est pas connecté
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    content: content,
  });

  if (error) {
    return { error: "Impossible d'envoyer le message. Réessayez plus tard." };
  }

  return { success: true };
}