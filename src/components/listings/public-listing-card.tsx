import Image from "next/image";
import Link from "next/link";
import { MapPin, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Listing } from "@/lib/supabase/database.types";

export type PublicListingSummary = Pick<
  Listing,
  "id" | "title" | "city" | "price" | "surface" | "photos" | "description"
>;

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function PublicListingCard({ listing }: { listing: PublicListingSummary }) {
  const firstPhoto =
    Array.isArray(listing.photos) && listing.photos.length > 0
      ? String(listing.photos[0])
      : null;

  const photoUrl = firstPhoto
    ? `/api/photo?url=${encodeURIComponent(firstPhoto)}`
    : null;

  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <Card className="group overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-accent/30">
        <div className="relative aspect-[4/3] bg-muted shrink-0 overflow-hidden">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Pas de photo
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          <h2 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-accent transition-colors">{listing.title}</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {listing.city}
          </p>
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <span className="text-lg font-bold text-accent">{priceFormatter.format(listing.price)}</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Ruler className="size-3" />
              {listing.surface} m2
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
