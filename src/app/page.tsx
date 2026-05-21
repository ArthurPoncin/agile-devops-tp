import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, PlusCircle, ArrowRight, Building2, MapPin, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  PublicListingCard,
  type PublicListingSummary,
} from "@/components/listings/public-listing-card";

const SHOWCASE_LIMIT = 6;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/annonces");
  }

  const { data } = await supabase
    .from("listings")
    .select("id, title, city, price, surface, photos")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(SHOWCASE_LIMIT);

  const listings = (data ?? []) as PublicListingSummary[];

  return (
    <main className="flex flex-col flex-1">
      <section className="relative flex flex-col items-center justify-center gap-8 px-6 py-28 text-center overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_70%)]" />

        <div className="relative flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm dark:bg-zinc-800">
            <Building2 className="size-4" />
            La plateforme immobilière simple et efficace
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Trouvez le bien
            <br />
            <span className="text-primary">qui vous ressemble</span>
          </h1>

          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            Parcourez des annonces vérifiées ou publiez la vôtre en quelques clics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/annonces" className={buttonVariants({ size: "lg" })}>
              <Search className="size-4" data-icon="inline-start" />
              Voir les annonces
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <PlusCircle className="size-4" data-icon="inline-start" />
              Déposer une annonce
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Search className="size-6 text-primary" />
            <h3 className="font-semibold">Recherche avancée</h3>
            <p className="text-sm text-muted-foreground">
              Filtrez par ville, prix, surface et type de bien.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <ShieldCheck className="size-6 text-primary" />
            <h3 className="font-semibold">Annonces vérifiées</h3>
            <p className="text-sm text-muted-foreground">
              Des biens réels publiés par des vendeurs identifiés.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <MapPin className="size-6 text-primary" />
            <h3 className="font-semibold">Partout en France</h3>
            <p className="text-sm text-muted-foreground">
              Maisons et appartements dans toutes les régions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Dernières annonces
            </h2>
            <p className="text-sm text-muted-foreground">
              Les biens les plus récents sur la plateforme
            </p>
          </div>
          <Link
            href="/annonces"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tout voir
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune annonce disponible pour le moment.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <PublicListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t bg-zinc-50 px-6 py-16 text-center dark:bg-zinc-900">
        <div className="mx-auto max-w-md space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Prêt à vous lancer ?
          </h2>
          <p className="text-muted-foreground">
            Créez votre compte gratuitement et commencez à chercher ou publier des annonces.
          </p>
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg" })}
          >
            Créer un compte
          </Link>
        </div>
      </section>
    </main>
  );
}
