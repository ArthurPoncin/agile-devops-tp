import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Search, ArrowRight, MoveRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, city, price, surface, photos, description")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(SHOWCASE_LIMIT);

  const listings = (data ?? []) as PublicListingSummary[];

  const heroPhotos = listings
    .filter((l) => Array.isArray(l.photos) && l.photos.length > 0)
    .slice(0, 3)
    .map((l) => ({
      url: `/api/photo?url=${encodeURIComponent(String((l.photos as string[])[0]))}`,
      title: l.title,
    }));

  return (
    <main className="flex flex-col flex-1">
      <section className="w-full py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Badge variant="outline" className="w-fit border-accent/30 text-accent">
                Nouveau sur ImmoMatch
              </Badge>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-lg text-5xl font-bold tracking-tighter md:text-7xl">
                  Trouvez le bien qui vous ressemble
                </h1>
                <p className="max-w-md text-xl leading-relaxed tracking-tight text-muted-foreground">
                  Parcourez des annonces vérifiées ou publiez la vôtre en quelques clics. Simple, rapide, efficace.
                </p>
              </div>
              <div className="flex flex-row gap-4">
                <Link href="/annonces" className={buttonVariants({ size: "lg", variant: "outline", className: "gap-2" })}>
                  <Search className="size-4" />
                  Voir les annonces
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "lg", className: "gap-2" })}>
                  Créer un compte
                  <MoveRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {heroPhotos.length >= 3 ? (
                <>
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    <Image src={heroPhotos[0].url} alt={heroPhotos[0].title} width={400} height={400} unoptimized className="aspect-square w-full object-cover" />
                  </div>
                  <div className="overflow-hidden rounded-xl border shadow-sm row-span-2">
                    <Image src={heroPhotos[1].url} alt={heroPhotos[1].title} width={400} height={800} unoptimized className="h-full w-full object-cover" />
                  </div>
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    <Image src={heroPhotos[2].url} alt={heroPhotos[2].title} width={400} height={400} unoptimized className="aspect-square w-full object-cover" />
                  </div>
                </>
              ) : (
                <>
                  <div className="aspect-square rounded-xl bg-muted" />
                  <div className="row-span-2 rounded-xl bg-muted" />
                  <div className="aspect-square rounded-xl bg-muted" />
                </>
              )}
            </div>
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
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Tout voir
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            Impossible de charger les annonces. Réessayez plus tard.
          </p>
        ) : listings.length === 0 ? (
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

      <section className="border-t bg-accent/5 px-6 py-16 text-center">
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
