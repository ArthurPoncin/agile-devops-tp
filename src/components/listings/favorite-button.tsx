"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/favorites/actions";

interface FavoriteButtonProps {
  listingId: string;
  initialIsFavorite: boolean;
  hasUser: boolean;
}

export function FavoriteButton({ listingId, initialIsFavorite, hasUser }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  if (!hasUser) return null; // N'affiche pas le bouton si l'internaute est anonyme

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Évite de déclencher le clic du lien de la carte
    if (isPending) return;

    // Optimistic UI : On change l'état immédiatement pour une sensation de rapidité
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    startTransition(async () => {
      const res = await toggleFavorite(listingId, isFavorite);
      if (res?.error) {
        // En cas d'erreur serveur, on remet l'ancienne valeur
        setIsFavorite(!nextState);
        alert(res.error);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-foreground shadow-sm transition-all hover:bg-accent hover:scale-110"
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        className={`h-5 w-5 transition-transform ${isFavorite ? "text-red-500 scale-110" : ""} ${isPending ? "opacity-50" : ""}`}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}