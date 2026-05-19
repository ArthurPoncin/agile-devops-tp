"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingInsert } from "@/lib/supabase/database.types";
import { deleteListingSchema, listingCreateSchema } from "./schema";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_COUNT = 10;

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = listingCreateSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    city: formData.get("city"),
    surface: formData.get("surface"),
    rooms: formData.get("rooms"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return { error: "Champs invalides." };
  }

  const photoFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.name !== "");

  if (photoFiles.length > MAX_PHOTO_COUNT) {
    return { error: `Maximum ${MAX_PHOTO_COUNT} photos.` };
  }
  for (const file of photoFiles) {
    if (!file.type.startsWith("image/")) {
      return { error: "Format de photo invalide." };
    }
    if (file.size > MAX_PHOTO_SIZE) {
      return { error: "Photo trop volumineuse (max 5 Mo)." };
    }
  }

  const uploadedPaths: string[] = [];
  for (const file of photoFiles) {
    const ext = extensionOf(file.name);
    const path = `${user.id}/${crypto.randomUUID()}${ext}`;
    const { error: uploadError } = await supabase.storage.from("listings").upload(path, file);
    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("listings").remove(uploadedPaths);
      }
      return { error: "Impossible d'envoyer les photos." };
    }
    uploadedPaths.push(path);
  }

  const payload: ListingInsert = {
    owner_id: user.id,
    title: parsed.data.title,
    type: parsed.data.type,
    city: parsed.data.city,
    surface: parsed.data.surface,
    rooms: parsed.data.rooms,
    price: parsed.data.price,
    photos: uploadedPaths,
    status: "active",
  };
  const { error } = await supabase.from("listings").insert(payload);

  if (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("listings").remove(uploadedPaths);
    }
    return { error: "Impossible de créer l'annonce." };
  }

  redirect("/");
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "";
  return filename.slice(dot).toLowerCase();
}

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
