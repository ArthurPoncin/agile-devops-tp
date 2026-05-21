import { createClient } from "@/lib/supabase/server";
import {
  PublicListingCard,
  type PublicListingSummary,
} from "@/components/listings/public-listing-card";
import { FavoriteButton } from "@/components/listings/favorite-button";
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

  const { data: { user } } = await supabase.auth.getUser();
  const { data, count, error } = await supabase
  .from("listings")
  .select(`
    id, title, city, price, surface, photos,
    favorites(user_id)
  `, { count: "exact" })
  .eq("status", "active")
  .eq("favorites.user_id", user?.id ?? "00000000-0000-0000-0000-000000000000")
  .order("created_at", { ascending: false })
  .range(from, to);

  interface ListingWithFavorite {
  id: string;
  title: string;
  city: string;
  price: number;
  surface: number;
  photos: any;
  favorites: { user_id: string }[];
  }

  const listings = (data ?? []) as any[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
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
  );
}