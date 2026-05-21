import Image from "next/image";
import { MapPin, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Listing } from "@/lib/supabase/database.types";

export type PublicListingSummary = Pick<
  Listing,
  "id" | "title" | "city" | "price" | "surface" | "photos"
>;

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

export function PublicListingCard({ listing }: { listing: PublicListingSummary }) {
  const firstPhotoPath =
    Array.isArray(listing.photos) && listing.photos.length > 0
      ? String(listing.photos[0])
      : null;

  const photoUrl = firstPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/listings/${firstPhotoPath}`
    : null;

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-muted shrink-0">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Pas de photo
          </div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col gap-2 flex-1">
        <h2 className="font-semibold text-base line-clamp-2 leading-snug">{listing.title}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {listing.city}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          <span className="text-lg font-bold">{priceFormatter.format(listing.price)}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Ruler className="size-3.5" />
            {listing.surface} m²
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
