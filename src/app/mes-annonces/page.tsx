import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import type { Listing } from "@/lib/supabase/database.types";

type ListingSummary = Pick<Listing, "id" | "title" | "status" | "created_at">;

export default async function MesAnnoncesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("listings")
    .select("id, title, status, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as ListingSummary[];
  const hasListings = listings.length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mes annonces</h1>
      {hasListings ? (
        <ul className="space-y-3">
          {listings.map((listing: ListingSummary) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez pas encore publié d&apos;annonce.
        </p>
      )}
    </main>
  );
}
