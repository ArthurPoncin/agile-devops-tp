import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteListingDialog } from "@/components/listings/delete-listing-dialog";
import { deleteListing } from "@/lib/listings/actions";
import type { Listing, ListingStatus } from "@/lib/supabase/database.types";

export type ListingSummary = Pick<
  Listing,
  "id" | "title" | "status" | "created_at" | "description" | "photos"
>;

const statusLabels: Record<ListingStatus, string> = {
  active: "Active",
  archived: "Archivée",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface ListingCardProps {
  listing: ListingSummary;
  supabase: any;
}

export function ListingCard({ listing, supabase }: ListingCardProps) {
  const photoPaths = Array.isArray(listing.photos)
    ? listing.photos.filter((p): p is string => typeof p === "string")
    : [];
  
  let firstPhotoUrl = null;
  if (photoPaths.length > 0) {
    const firstPath = photoPaths[0];
    firstPhotoUrl = firstPath.startsWith("https://")
      ? `/api/photo?url=${encodeURIComponent(firstPath)}`
      : supabase.storage.from("listings").getPublicUrl(firstPath).data.publicUrl;
  }

  return (
    <article className="flex gap-4 rounded-md border p-4 items-center justify-between">
      <div className="flex gap-4 items-center min-w-0 flex-1">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 border dark:bg-zinc-900">
          {firstPhotoUrl ? (
            <img
              src={firstPhotoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              Pas d'image
            </div>
          )}
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <h2 className="font-medium truncate">{listing.title}</h2>
          {listing.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {listing.description}
            </p>
          )}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {dateFormatter.format(new Date(listing.created_at))}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <Badge variant={listing.status === "active" ? "default" : "secondary"}>
          {statusLabels[listing.status]}
        </Badge>
        
        <Link href={`/listings/${listing.id}/edit`} passHref>
          <Button variant="outline" size="sm">
            Modifier
          </Button>
        </Link>

        <DeleteListingDialog listingId={listing.id} action={deleteListing} />
      </div>
    </article>
  );
}