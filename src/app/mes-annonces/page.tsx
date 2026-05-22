import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlusCircle, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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

  // Ajout de description et photos dans le select
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, status, created_at, description, photos")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as ListingSummary[];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Mes annonces</h1>
          {!error && listings.length > 0 && (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
              {listings.length}
            </span>
          )}
        </div>
        <Link
          href="/listings/new"
          className={buttonVariants({ size: "sm" })}
        >
          <PlusCircle className="size-4" />
          Publier
        </Link>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger vos annonces. Réessayez plus tard.
        </p>
      ) : listings.length > 0 ? (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              {/* On passe le client supabase pour récupérer l'URL publique de l'image */}
              <ListingCard listing={listing} supabase={supabase} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/30 py-16">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <FileText className="size-6" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium">Aucune annonce</p>
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas encore publié d&apos;annonce.
            </p>
          </div>
          <Link
            href="/listings/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusCircle className="size-4" />
            Publier une annonce
          </Link>
        </div>
      )}
    </main>
  );
}