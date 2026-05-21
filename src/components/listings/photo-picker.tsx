"use client";

import { useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PhotoEntry = { file: File; previewUrl: string };

interface PhotoPickerProps {
  photos: PhotoEntry[];
  onChange: (photos: PhotoEntry[]) => void;
}

export function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const entries: PhotoEntry[] = Array.from(fileList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...photos, ...entries]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(
      photos.filter((entry, i) => {
        if (i === index) URL.revokeObjectURL(entry.previewUrl);
        return i !== index;
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-4" />
        Ajouter des photos
      </Button>
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((entry, i) => (
            <li key={entry.previewUrl} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.previewUrl}
                alt={entry.file.name}
                className="aspect-square w-full rounded-md object-cover border"
              />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label={`Supprimer la photo ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
