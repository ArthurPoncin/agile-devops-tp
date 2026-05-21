import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/supabase/database.types";

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
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", listing.owner_id)
    .single();

  const photoPaths = Array.isArray(listing.photos)
    ? listing.photos.filter((p): p is string => typeof p === "string")
    : [];
  const photoUrls = photoPaths.map((path) => ({
    path,
    url: supabase.storage.from("listings").getPublicUrl(path).data.publicUrl,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>

      {photoUrls.length > 0 ? (
        <section className="space-y-3">
          <h2 className="sr-only">Photos</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {photoUrls.map(({ path, url }, index) => (
              <li key={path} className="overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${listing.title} — photo ${index + 1}`}
                  className="aspect-video w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Caractéristiques</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{typeLabels[listing.type]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ville</dt>
            <dd>{listing.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Surface</dt>
            <dd>{listing.surface} m²</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nombre de pièces</dt>
            <dd>{listing.rooms} pièces</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prix</dt>
            <dd>{priceFormatter.format(listing.price)}</dd>
          </div>
        </dl>
      </section>

      {listing.description ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Description</h2>
          <p className="text-sm whitespace-pre-line">{listing.description}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Vendeur</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nom</dt>
            <dd>{owner?.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd>{owner?.phone?.trim() ? owner.phone : "Non renseigné"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
