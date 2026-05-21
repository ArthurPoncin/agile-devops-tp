import { Button } from "@/components/ui/button";
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

export function ListingFilters({ values }: { values: ListingFiltersValues }) {
  return (
    <form
      method="get"
      role="search"
      aria-label="Filtres des annonces"
      className="rounded-md border bg-card p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
        <Button type="submit" className="w-full">
          Rechercher
        </Button>
      </div>
    </form>
  );
}
