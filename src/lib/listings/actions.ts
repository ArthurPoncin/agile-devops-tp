"use server";

import { put, del as blobDel } from "@vercel/blob";
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
    description: formData.get("description") || undefined,
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

  const uploadedUrls: string[] = [];
  for (const file of photoFiles) {
    const ext = extensionOf(file.name);
    const pathname = `annonce/${crypto.randomUUID()}${ext}`;
    try {
      const { url } = await put(pathname, file, {
        access: "private",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      uploadedUrls.push(url);
    } catch {
      if (uploadedUrls.length > 0) {
        await blobDel(uploadedUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      return { error: "Impossible d'envoyer les photos." };
    }
  }

  const payload: ListingInsert = {
    owner_id: user.id,
    title: parsed.data.title,
    type: parsed.data.type,
    city: parsed.data.city,
    surface: parsed.data.surface,
    rooms: parsed.data.rooms,
    price: parsed.data.price,
    photos: uploadedUrls,
    status: "active",
    ...(parsed.data.description ? { description: parsed.data.description } : {}),
  };
  const { error } = await supabase.from("listings").insert(payload);

  if (error) {
    console.error("[createListing] supabase insert error:", error);
    if (uploadedUrls.length > 0) {
      await blobDel(uploadedUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
    return { error: `Impossible de créer l'annonce. (${error.message})` };
  }

  redirect("/");
}


export async function updateListing(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Modification impossible. Vous devez être connecté." };
  }

  const parsed = listingCreateSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    city: formData.get("city"),
    surface: formData.get("surface"),
    rooms: formData.get("rooms"),
    price: formData.get("price"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: "Champs invalides." };
  }

  // Photos existantes à conserver (envoyées depuis le formulaire)
  const keepPhotos = formData
    .getAll("keepPhoto")
    .filter((v): v is string => typeof v === "string" && v.startsWith("http"));

  // Nouvelles photos à uploader
  const photoFiles = formData
    .getAll("photos")
    .filter(
      (entry): entry is File =>
        entry instanceof File && entry.size > 0 && entry.name !== "",
    );

  if (keepPhotos.length + photoFiles.length > MAX_PHOTO_COUNT) {
    return { error: `Maximum ${MAX_PHOTO_COUNT} photos.` };
  }

  for (const file of photoFiles) {
    if (!file.type.startsWith("image/")) return { error: "Format de photo invalide." };
    if (file.size > MAX_PHOTO_SIZE) return { error: "Photo trop volumineuse (max 5 Mo)." };
  }

  // Récupérer les photos actuelles pour supprimer celles retirées
  const { data: currentListing } = await supabase
    .from("listings")
    .select("photos")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!currentListing) {
    return { error: "Modification impossible. Vous n'êtes pas le propriétaire." };
  }

  const currentPhotos = Array.isArray(currentListing.photos)
    ? (currentListing.photos as string[])
    : [];

  const deletedPhotos = currentPhotos.filter((url) => !keepPhotos.includes(url));

  if (deletedPhotos.length > 0) {
    try {
      await blobDel(deletedPhotos, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      console.error("[updateListing] impossible de supprimer des photos du blob");
    }
  }

  // Uploader les nouvelles photos
  const newUrls: string[] = [];
  for (const file of photoFiles) {
    const ext = extensionOf(file.name);
    const pathname = `annonce/${crypto.randomUUID()}${ext}`;
    try {
      const { url } = await put(pathname, file, {
        access: "private",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      newUrls.push(url);
    } catch {
      if (newUrls.length > 0) {
        await blobDel(newUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      return { error: "Impossible d'envoyer les photos." };
    }
  }

  const photos = [...keepPhotos, ...newUrls];

  const { error, data } = await supabase
    .from("listings")
    .update({
      title: parsed.data.title,
      type: parsed.data.type,
      city: parsed.data.city,
      surface: parsed.data.surface,
      rooms: parsed.data.rooms,
      price: parsed.data.price,
      description: parsed.data.description ?? null,
      photos,
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select();

  if (error) {
    return { error: "Erreur lors de la mise à jour de l'annonce." };
  }
  if (!data || data.length === 0) {
    return { error: "Modification impossible. Vous n'êtes pas le propriétaire." };
  }

  revalidatePath("/mes-annonces");
  redirect("/mes-annonces");
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
