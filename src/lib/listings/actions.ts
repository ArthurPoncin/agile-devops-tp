"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteListingSchema } from "./schema";

export async function deleteListing(formData: FormData) {
  const parsed = deleteListingSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: "Suppression impossible. Annonce introuvable." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("listings").delete().eq("id", parsed.data.id);

  if (error) {
    return { error: "Suppression impossible. Réessayez plus tard." };
  }

  revalidatePath("/mes-annonces");
}
