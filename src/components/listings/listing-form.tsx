"use client";

import { useActionState, useRef, useState, useTransition, startTransition, type ComponentRef } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDescription } from "@/lib/ai/generate-description";
import { PhotoPicker, type PhotoEntry } from "./photo-picker";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 768;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = objectUrl;
  });
}

type ListingState = { error?: string } | null;
type ListingAction = (formData: FormData) => Promise<void | { error: string }>;

interface ListingFormProps {
  action: ListingAction;
  initialData?: {
    title: string;
    type: string;
    city: string;
    surface: number;
    rooms: number;
    price: number;
  };
}

export function ListingForm({ action, initialData }: ListingFormProps) {
  const [state, formAction, pending] = useActionState<ListingState, FormData>(
    async (_prev, formData) => (await action(formData)) ?? null,
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<ComponentRef<"textarea">>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoEntry[]>([]);

  const isEdit = !!initialData;

  function handleGenerate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setGenError(null);
    startGenerate(async () => {
      const images = await Promise.all(
        selectedPhotos.slice(0, 4).map(({ file }) => compressImage(file)),
      );
      const result = await generateDescription({
        title: String(fd.get("title") ?? ""),
        type: String(fd.get("type") ?? ""),
        city: String(fd.get("city") ?? ""),
        surface: String(fd.get("surface") ?? ""),
        rooms: String(fd.get("rooms") ?? ""),
        price: String(fd.get("price") ?? ""),
        images,
      });
      if ("error" in result) {
        setGenError(result.error);
      } else if (descriptionRef.current) {
        descriptionRef.current.value = result.description;
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    for (const { file } of selectedPhotos) {
      fd.append("photos", file);
    }
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData?.title ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          required
          defaultValue={initialData?.type ?? ""}
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
        <Input
          id="city"
          name="city"
          type="text"
          required
          defaultValue={initialData?.city ?? ""}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="surface">Surface (m²)</Label>
          <Input
            id="surface"
            name="surface"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initialData?.surface ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rooms">Nombre de pièces</Label>
          <Input
            id="rooms"
            name="rooms"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initialData?.rooms ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Prix (€)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initialData?.price ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="size-3.5" />
            {isGenerating ? "Génération…" : "Générer avec l'IA"}
          </Button>
        </div>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={5}
          defaultValue=""
          placeholder="Décrivez votre bien…"
        />
        {genError && (
          <p role="alert" className="text-sm text-destructive">
            {genError}
          </p>
        )}
      </div>

      {!isEdit && (
        <div className="flex flex-col gap-2">
          <Label>Photos</Label>
          <PhotoPicker photos={selectedPhotos} onChange={setSelectedPhotos} />
        </div>
      )}

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {isEdit ? "Enregistrer les modifications" : "Publier l'annonce"}
      </Button>
    </form>
  );
}
