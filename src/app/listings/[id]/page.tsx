import { notFound, redirect } from "next/navigation";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listingData } = await supabase
    .from("listings")
    .select(
      `id, owner_id, title, type, city, surface, rooms, price, description, photos,
       favorites(user_id)`,
    )
    .eq("id", id)
    .eq("favorites.user_id", user?.id ?? "00000000-0000-0000-0000-000000000000")
    .single();

  if (!listingData) {
    notFound();
  }

  const listing = listingData as Listing & { favorites: { user_id: string }[] };
  const isFavorite = Array.isArray(listing.favorites) && listing.favorites.length > 0;

  const photoPaths = Array.isArray(listing.photos)
    ? listing.photos.filter((p): p is string => typeof p === "string")
    : [];

  const photoUrls = photoPaths.map((path) => ({
    path,
    url: path.startsWith("https://")
      ? `/api/photo?url=${encodeURIComponent(path)}`
      : supabase.storage.from("listings").getPublicUrl(path).data.publicUrl,
  }));

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", listing.owner_id)
    .single();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{typeLabels[listing.type]}</span>
            <span>-</span>
            <span>{listing.city}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-accent">{priceFormatter.format(listing.price)}</span>
          <FavoriteButton
            listingId={listing.id}
            initialIsFavorite={isFavorite}
            hasUser={!!user}
          />
        </div>
      </div>

      {photoUrls.length > 0 && (
        <section className="space-y-3">
          <h2 className="sr-only">Photos</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {photoUrls.map(({ path, url }, index) => (
              <li key={path} className="overflow-hidden rounded-xl border shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${listing.title} - photo ${index + 1}`}
                  className="aspect-video w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Caractéristiques</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="font-medium">{typeLabels[listing.type]}</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Ville</dt>
                <dd className="font-medium">{listing.city}</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Surface</dt>
                <dd className="font-medium">{listing.surface} m²</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Pièces</dt>
                <dd className="font-medium">{listing.rooms} pièces</dd>
              </div>
              <div className="rounded-lg bg-accent/10 p-3 border border-accent/20">
                <dt className="text-xs text-accent">Prix</dt>
                <dd className="font-bold text-accent">{priceFormatter.format(listing.price)}</dd>
              </div>
            </dl>
          </section>

          {listing.description ? (
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{listing.description}</p>
            </section>
          ) : null}
        </div>

        <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4 h-fit lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Vendeur</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Nom</dt>
              <dd className="font-medium">{owner?.full_name?.trim() || "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{owner?.phone?.trim() || "Non renseigné"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
