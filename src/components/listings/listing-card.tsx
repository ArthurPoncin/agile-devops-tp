import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteListingDialog } from "@/components/listings/delete-listing-dialog";
import { deleteListing } from "@/lib/listings/actions";
import type { Listing, ListingStatus } from "@/lib/supabase/database.types";

export type ListingSummary = Pick<
  Listing,
  "id" | "title" | "status" | "created_at"
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

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <article className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-accent/30">
      <div className="space-y-1">
        <h2 className="font-medium">{listing.title}</h2>
        <p className="text-sm text-muted-foreground">
          {dateFormatter.format(new Date(listing.created_at))}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={listing.status === "active" ? "default" : "secondary"}>
          {statusLabels[listing.status]}
        </Badge>

        <Link
          href={`/listings/${listing.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Modifier
        </Link>

        <DeleteListingDialog listingId={listing.id} action={deleteListing} />
      </div>
    </article>
  );
}