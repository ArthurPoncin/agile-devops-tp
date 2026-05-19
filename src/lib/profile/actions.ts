"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "./schema";

export type ProfileData = {
  full_name: string;
  email: string;
  phone: string;
};

export async function getProfile(): Promise<ProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    full_name: data.full_name ?? "",
    email: user.email ?? "",
    phone: data.phone ?? "",
  };
}

export type UpdateProfileResult =
  | { ok: true; emailChangePending: boolean }
  | { error: string };

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté pour modifier votre profil." };
  }

  const parsed = profileUpdateSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const { full_name, email, phone } = parsed.data;
  const normalizedPhone = !phone || phone.trim() === "" ? null : phone.trim();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ full_name, phone: normalizedPhone })
    .eq("id", user.id);

  if (updateError) {
    return { error: "Impossible de mettre à jour le profil." };
  }

  let emailChangePending = false;
  if (email !== user.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) {
      return {
        error:
          "Nom et téléphone enregistrés, mais impossible de mettre à jour l'email. Réessayez plus tard.",
      };
    }
    emailChangePending = true;
  }

  revalidatePath("/profile");
  return { ok: true, emailChangePending };
}
