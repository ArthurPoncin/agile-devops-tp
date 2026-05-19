import { Badge } from "@/components/ui/badge";
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
    <article className="flex items-center justify-between rounded-md border p-4">
      <div className="space-y-1">
        <h2 className="font-medium">{listing.title}</h2>
        <p className="text-sm text-muted-foreground">
          {dateFormatter.format(new Date(listing.created_at))}
        </p>
      </div>
      <Badge variant={listing.status === "active" ? "default" : "secondary"}>
        {statusLabels[listing.status]}
      </Badge>
    </article>
  );
}
