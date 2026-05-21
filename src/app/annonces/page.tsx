import { createClient } from "@/lib/supabase/server";
import {
  PublicListingCard,
  type PublicListingSummary,
} from "@/components/listings/public-listing-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 9;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AnnoncesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data, count, error } = await supabase
    .from("listings")
    .select("id, title, city, price, surface, photos", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  const listings = (data ?? []) as PublicListingSummary[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Annonces</h1>
        {!error && (
          <span className="text-sm text-muted-foreground">
            {count ?? 0} bien{(count ?? 0) > 1 ? "s" : ""} disponible{(count ?? 0) > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger les annonces. Réessayez plus tard.
        </p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune annonce disponible.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <li key={listing.id}>
                <PublicListingCard listing={listing} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/annonces?page=${page - 1}`}
                      text="Précédent"
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                  )
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("ellipsis");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href={`/annonces?page=${item}`}
                          isActive={item === page}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={`/annonces?page=${page + 1}`}
                      text="Suivant"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </main>
  );
}
