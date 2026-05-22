"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ListingFiltersValues = {
  city?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  surfaceMin?: string;
  surfaceMax?: string;
  rooms?: string;
};

const selectClassName =
  "border-input bg-transparent dark:bg-input/30 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const DEBOUNCE_MS = 400;

const FILTER_KEYS = [
  "city",
  "type",
  "priceMin",
  "priceMax",
  "surfaceMin",
  "surfaceMax",
  "rooms",
] as const satisfies ReadonlyArray<keyof ListingFiltersValues>;

function valuesToQuery(values: ListingFiltersValues): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = values[key]?.trim();
    if (v) params.set(key, v);
  }
  return params.toString();
}

export function ListingFilters({
  values,
  resetHref = "/annonces",
}: {
  values: ListingFiltersValues;
  resetHref?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<ListingFiltersValues>(values);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentQueryRef = useRef<string>(valuesToQuery(values));

  // Sync local state when `values` change from outside the form (e.g.
  // Réinitialiser navigation, browser back/forward). Skipped when the change
  // matches what we just sent, so typing never disturbs the inputs.
  const incomingQuery = valuesToQuery(values);
  useEffect(() => {
    if (incomingQuery !== lastSentQueryRef.current) {
      lastSentQueryRef.current = incomingQuery;
      setFilters(values);
    }
    // values is fully described by incomingQuery for our purposes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingQuery]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function scheduleSearch(next: ListingFiltersValues) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const query = valuesToQuery(next);
      if (query === lastSentQueryRef.current) return;
      lastSentQueryRef.current = query;
      router.replace(query ? `${resetHref}?${query}` : resetHref, {
        scroll: false,
      });
    }, DEBOUNCE_MS);
  }

  function update<K extends keyof ListingFiltersValues>(key: K, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      scheduleSearch(next);
      return next;
    });
  }

  return (
    <form
      method="get"
      role="search"
      aria-label="Filtres des annonces"
      className="rounded-xl border bg-card p-5 shadow-sm grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          name="city"
          type="text"
          value={filters.city ?? ""}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Nantes"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type de bien</Label>
        <select
          id="type"
          name="type"
          value={filters.type ?? ""}
          onChange={(e) => update("type", e.target.value)}
          className={selectClassName}
        >
          <option value="">Tous</option>
          <option value="maison">Maison</option>
          <option value="appartement">Appartement</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="priceMin">Prix min (€)</Label>
        <Input
          id="priceMin"
          name="priceMin"
          type="number"
          min={1}
          step={1}
          value={filters.priceMin ?? ""}
          onChange={(e) => update("priceMin", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="priceMax">Prix max (€)</Label>
        <Input
          id="priceMax"
          name="priceMax"
          type="number"
          min={1}
          step={1}
          value={filters.priceMax ?? ""}
          onChange={(e) => update("priceMax", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="surfaceMin">Surface min (m²)</Label>
        <Input
          id="surfaceMin"
          name="surfaceMin"
          type="number"
          min={1}
          step={1}
          value={filters.surfaceMin ?? ""}
          onChange={(e) => update("surfaceMin", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="surfaceMax">Surface max (m²)</Label>
        <Input
          id="surfaceMax"
          name="surfaceMax"
          type="number"
          min={1}
          step={1}
          value={filters.surfaceMax ?? ""}
          onChange={(e) => update("surfaceMax", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rooms">Pièces (min)</Label>
        <Input
          id="rooms"
          name="rooms"
          type="number"
          min={1}
          step={1}
          value={filters.rooms ?? ""}
          onChange={(e) => update("rooms", e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <Link
          href={resetHref}
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
