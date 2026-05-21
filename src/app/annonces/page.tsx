import { createClient } from "@/lib/supabase/server";
import {
  PublicListingCard,
  type PublicListingSummary,
} from "@/components/listings/public-listing-card";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ListingFilters } from "@/components/listings/listing-filters";
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

const VALID_TYPES = ["maison", "appartement"] as const;
type ListingTypeFilter = (typeof VALID_TYPES)[number];

function isValidType(value: string | undefined): value is ListingTypeFilter {
  return (
    typeof value === "string" &&
    (VALID_TYPES as readonly string[]).includes(value)
  );
}

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
}

type Props = {
  searchParams: Promise<{
    page?: string;
    city?: string;
    type?: string;
    priceMin?: string;
    priceMax?: string;
    surfaceMin?: string;
    surfaceMax?: string;
    rooms?: string;
  }>;
};

export default async function AnnoncesPage({ searchParams }: Props) {
  const {
    page: pageParam,
    city,
    type,
    priceMin: priceMinRaw,
    priceMax: priceMaxRaw,
    surfaceMin: surfaceMinRaw,
    surfaceMax: surfaceMaxRaw,
    rooms: roomsRaw,
  } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const trimmedCity = city?.trim() || null;
  const validType = isValidType(type) ? type : null;
  const priceMin = parsePositiveInt(priceMinRaw);
  const priceMax = parsePositiveInt(priceMaxRaw);
  const surfaceMin = parsePositiveInt(surfaceMinRaw);
  const surfaceMax = parsePositiveInt(surfaceMaxRaw);
  const rooms = parsePositiveInt(roomsRaw);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select(
      `id, title, city, price, surface, photos, description,
       favorites(user_id)`,
      { count: "exact" },
    )
    .eq("status", "active")
    .eq("favorites.user_id", user?.id ?? "00000000-0000-0000-0000-000000000000");

  if (trimmedCity) query = query.ilike("city", `%${trimmedCity}%`);
  if (validType) query = query.eq("type", validType);
  if (priceMin !== null) query = query.gte("price", priceMin);
  if (priceMax !== null) query = query.lte("price", priceMax);
  if (surfaceMin !== null) query = query.gte("surface", surfaceMin);
  if (surfaceMax !== null) query = query.lte("surface", surfaceMax);
  if (rooms !== null) query = query.gte("rooms", rooms);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const listings = (data ?? []) as Array<
    PublicListingSummary & { favorites: { user_id: string }[] }
  >;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const filterParams: Record<string, string | null> = {
    city: trimmedCity,
    type: validType,
    priceMin: priceMin?.toString() ?? null,
    priceMax: priceMax?.toString() ?? null,
    surfaceMin: surfaceMin?.toString() ?? null,
    surfaceMax: surfaceMax?.toString() ?? null,
    rooms: rooms?.toString() ?? null,
  };

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filterParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", targetPage.toString());
    return `/annonces?${params.toString()}`;
  }

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

      <ListingFilters
        values={{
          city: trimmedCity ?? "",
          type: validType ?? "",
          priceMin: priceMin?.toString() ?? "",
          priceMax: priceMax?.toString() ?? "",
          surfaceMin: surfaceMin?.toString() ?? "",
          surfaceMax: surfaceMax?.toString() ?? "",
          rooms: rooms?.toString() ?? "",
        }}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger les annonces. Réessayez plus tard.
        </p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune annonce disponible.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => {
              const isFavorite = Array.isArray(listing.favorites) && listing.favorites.length > 0;

              return (
                <li key={listing.id} className="relative">
                  <PublicListingCard listing={listing} />
                  <div className="absolute right-3 top-3 z-10">
                    <FavoriteButton 
                      listingId={listing.id} 
                      initialIsFavorite={isFavorite} 
                      hasUser={!!user} 
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={pageHref(page - 1)}
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
                          href={pageHref(item)}
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
                      href={pageHref(page + 1)}
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