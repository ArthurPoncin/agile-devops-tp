"use client";

import { useEffect, useRef } from "react";
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

export function ListingFilters({ values }: { values: ListingFiltersValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function scheduleSearch() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        const v = String(value).trim();
        if (v) params.set(key, v);
      }
      const query = params.toString();
      if (query === lastQueryRef.current) return;
      lastQueryRef.current = query;
      router.replace(query ? `/annonces?${query}` : "/annonces", {
        scroll: false,
      });
    }, DEBOUNCE_MS);
  }

  // `key` forces a remount (and resets uncontrolled defaultValues) when the
  // URL-derived filters change from outside the form — e.g. the user clicks
  // "Réinitialiser" or navigates with browser back/forward.
  const formKey = JSON.stringify(values);

  return (
    <form
      key={formKey}
      ref={formRef}
      method="get"
      role="search"
      aria-label="Filtres des annonces"
      className="rounded-xl border bg-card p-5 shadow-sm grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => e.preventDefault()}
      onChange={scheduleSearch}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          name="city"
          type="text"
          defaultValue={values.city ?? ""}
          placeholder="Nantes"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type de bien</Label>
        <select
          id="type"
          name="type"
          defaultValue={values.type ?? ""}
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
          defaultValue={values.priceMin ?? ""}
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
          defaultValue={values.priceMax ?? ""}
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
          defaultValue={values.surfaceMin ?? ""}
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
          defaultValue={values.surfaceMax ?? ""}
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
          defaultValue={values.rooms ?? ""}
        />
      </div>

      <div className="flex items-end">
        <Link
          href="/annonces"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
