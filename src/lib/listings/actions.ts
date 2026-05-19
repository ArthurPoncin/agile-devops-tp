"use server";

import { createClient } from "@/lib/supabase/server";
import type { ListingInsert } from "@/lib/supabase/database.types";
import { redirect } from "next/navigation";
import { listingCreateSchema } from "./schema";

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

  const uploadedPaths: string[] = [];
  for (const file of photoFiles) {
    const ext = extensionOf(file.name);
    const path = `${user.id}/${crypto.randomUUID()}${ext}`;
    const { error: uploadError } = await supabase.storage.from("listings").upload(path, file);
    if (uploadError) {
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
    return { error: "Impossible de créer l'annonce." };
  }

  redirect("/");
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "";
  return filename.slice(dot).toLowerCase();
}
