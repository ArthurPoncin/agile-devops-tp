"use server";

import { createClient } from "@/lib/supabase/server";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  listings?: ReferencedListing[];
};

export type ReferencedListing = {
  id: string;
  title: string;
  city: string;
  type: string;
  price: number;
  surface: number;
  rooms: number;
  photoUrl: string | null;
};

const SYSTEM_PROMPT_BASE = [
  "Tu es l'assistant virtuel d'ImmoMatch, une plateforme immobilière française.",
  "Tu aides les visiteurs à comprendre comment utiliser le site (chercher une annonce, contacter un vendeur, publier un bien), tu réponds à des questions générales sur l'immobilier, et tu peux proposer des annonces pertinentes parmi celles publiées sur le site.",
  "Réponds toujours en français, de manière courte (2 à 5 phrases) et chaleureuse.",
  "Réponds STRICTEMENT en texte brut : pas de markdown, pas de gras (**), pas d'italique (*), pas de titres (#), pas de listes à puces (-) ni numérotées, pas de code (```). Les liens doivent être collés tels quels dans le texte (ex: voir /listings/abc-123).",
  "Tu as accès ci-dessous à la liste exhaustive des annonces actuellement publiées avec leurs caractéristiques (type, ville, surface, pièces, prix).",
  "Recommandation d'annonces — règles ABSOLUES :",
  "1) N'invente JAMAIS d'annonce qui n'est pas dans la liste ci-dessous.",
  "2) Avant de proposer une annonce, vérifie LIGNE PAR LIGNE qu'elle respecte TOUS les critères donnés par l'utilisateur. Si l'utilisateur dit \"moins de X €\", le prix de l'annonce DOIT être strictement inférieur ou égal à X. Si l'utilisateur dit \"à Nantes\", la ville DOIT être exactement Nantes. Idem pour le type (maison/appartement), la surface, le nombre de pièces.",
  "3) Ne propose JAMAIS une annonce qui dépasse le budget ou ne correspond pas à un critère, même si elle est proche.",
  "4) Si AUCUNE annonce de la liste ne correspond aux critères, dis-le honnêtement (\"Aucune annonce ne correspond exactement à votre recherche aujourd'hui\") et propose d'élargir les critères ou d'aller voir /annonces. Ne propose rien dans ce cas.",
  "5) Limite-toi à 1 à 3 annonces maximum, et colle leur lien sous la forme /listings/<id>.",
  "Ne donne pas de conseils juridiques ou fiscaux engageants : oriente vers un professionnel si nécessaire.",
].join(" ");

type ListingForContext = {
  id: string;
  title: string;
  type: string;
  city: string;
  surface: number;
  rooms: number;
  price: number;
};

type ListingForPreview = ListingForContext & {
  photos: unknown;
};

const LISTING_ID_RE = /\/listings\/([a-f0-9-]{8,})/gi;

function extractPhotoPaths(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === "string");
      }
    } catch {
      // not JSON, fall through
    }
    return raw.trim() ? [raw] : [];
  }
  return [];
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function buildPhotoUrl(
  supabase: SupabaseClient,
  paths: string[],
): string | null {
  if (paths.length === 0) return null;
  const first = paths[0];
  if (first.startsWith("https://")) {
    return `/api/photo?url=${encodeURIComponent(first)}`;
  }
  return supabase.storage.from("listings").getPublicUrl(first).data.publicUrl;
}

async function fetchListingsContext(): Promise<{
  prompt: string;
  byId: Map<string, ListingForPreview>;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient();
  try {
    const { data } = await supabase
      .from("listings")
      .select("id, title, type, city, surface, rooms, price, photos")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(40);

    const listings = (data ?? []) as ListingForPreview[];
    const byId = new Map(listings.map((l) => [l.id, l]));

    if (listings.length === 0) {
      return { prompt: "Aucune annonce active pour le moment.", byId, supabase };
    }

    const lines = listings.map((l) => {
      const price = l.price.toLocaleString("fr-FR");
      return `- "${l.title}" — ${l.type}, ${l.city}, ${l.surface} m², ${l.rooms} pièces, ${price} € → /listings/${l.id}`;
    });

    return {
      prompt: ["Annonces actuellement publiées :", ...lines].join("\n"),
      byId,
      supabase,
    };
  } catch {
    return {
      prompt: "Liste des annonces indisponible pour le moment.",
      byId: new Map(),
      supabase,
    };
  }
}

function extractReferencedListings(
  reply: string,
  byId: Map<string, ListingForPreview>,
  supabase: SupabaseClient,
): ReferencedListing[] {
  const seen = new Set<string>();
  const result: ReferencedListing[] = [];
  for (const match of reply.matchAll(LISTING_ID_RE)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const listing = byId.get(id);
    if (!listing) continue;
    result.push({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      type: listing.type,
      price: listing.price,
      surface: listing.surface,
      rooms: listing.rooms,
      photoUrl: buildPhotoUrl(supabase, extractPhotoPaths(listing.photos)),
    });
  }
  return result;
}

export async function chatWithAssistant(
  history: ChatMessage[],
): Promise<{ reply: string; listings: ReferencedListing[] } | { error: string }> {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return { error: "Message vide." };
  }

  const trimmed = history
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  const { prompt: listingsContext, byId, supabase } = await fetchListingsContext();
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${listingsContext}`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmed,
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      return { error: "L'assistant est momentanément indisponible." };
    }

    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content?.trim() ?? "";

    // Belt-and-braces : strip any residual markdown the model might emit.
    const reply = raw
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^[\s]*[-*•]\s+/gm, "")
      .trim();

    if (!reply) {
      return { error: "Pas de réponse, réessayez." };
    }

    const listings = extractReferencedListings(reply, byId, supabase);

    return { reply, listings };
  } catch {
    return { error: "L'assistant est momentanément indisponible." };
  }
}
