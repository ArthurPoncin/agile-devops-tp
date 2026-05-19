"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteListingSchema } from "./schema";

export type DeleteListingResult = { ok: true } | { error: string };

export async function deleteListing(formData: FormData): Promise<DeleteListingResult> {
  const parsed = deleteListingSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: "Suppression impossible. Annonce introuvable." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Suppression impossible. Vous devez être connecté." };
  }

  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", parsed.data.id)
    .select();

  if (error) {
    return { error: "Suppression impossible. Réessayez plus tard." };
  }

  if (!data || data.length === 0) {
    return { error: "Suppression impossible. Annonce introuvable." };
  }

  revalidatePath("/mes-annonces");
  return { ok: true };
}
