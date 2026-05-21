import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingType } from "@/lib/supabase/database.types";
import { FavoriteButton } from "@/components/listings/favorite-button";
const idSchema = z.string().uuid();

const typeLabels: Record<ListingType, string> = {
  maison: "Maison",
  appartement: "Appartement",
};

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!idSchema.safeParse(id).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listingData } = await supabase
  .from("listings")
  .select(`
    id, owner_id, title, type, city, surface, rooms, price, description, photos,
    favorites(user_id)
  `)
  .eq("id", id)
  .eq("favorites.user_id", user?.id ?? "00000000-0000-0000-0000-000000000000")
  .single();

if (!listingData) {
  notFound();
}

const listing = listingData as Listing & { favorites: { user_id: string }[] };
const photoPaths = Array.isArray(listing.photos)
    ? listing.photos.filter((p): p is string => typeof p === "string")
    : [];
const photoUrls = photoPaths.map((path) => ({
    path,
    url: /^https?:\/\//.test(path)
      ? path
      : supabase.storage.from("listings").getPublicUrl(path).data.publicUrl,
}));

const isFavorite = Array.isArray(listing.favorites) && listing.favorites.length > 0;


  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
        <FavoriteButton 
          listingId={listing.id} 
          initialIsFavorite={isFavorite} 
          hasUser={!!user} 
        />
      </div>

    </main>
  );
}
