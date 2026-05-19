"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ListingState = { error?: string } | null;
type ListingAction = (formData: FormData) => Promise<void | { error: string }>;

export function ListingForm({ action }: { action: ListingAction }) {
  const [state, formAction, pending] = useActionState<ListingState, FormData>(
    async (_prev, formData) => (await action(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" type="text" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          required
          defaultValue=""
          className="border-input bg-transparent dark:bg-input/30 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          <option value="" disabled>
            Sélectionner
          </option>
          <option value="maison">Maison</option>
          <option value="appartement">Appartement</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">Ville</Label>
        <Input id="city" name="city" type="text" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="surface">Surface (m²)</Label>
          <Input id="surface" name="surface" type="number" min={1} step={1} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rooms">Nombre de pièces</Label>
          <Input id="rooms" name="rooms" type="number" min={1} step={1} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Prix (€)</Label>
          <Input id="price" name="price" type="number" min={1} step={1} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="photos">Photos</Label>
        <Input id="photos" name="photos" type="file" accept="image/*" multiple />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        Publier l&apos;annonce
      </Button>
    </form>
  );
}
