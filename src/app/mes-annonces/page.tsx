import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ListingCard,
  type ListingSummary,
} from "@/components/listings/listing-card";

export default async function MesAnnoncesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, status, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as ListingSummary[];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mes annonces</h1>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger vos annonces. Réessayez plus tard.
        </p>
      ) : listings.length > 0 ? (
        <ul className="space-y-3">
          {listings.map((listing) => (
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
