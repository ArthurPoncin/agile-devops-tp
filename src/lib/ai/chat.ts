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

const MAX_LISTINGS_WITH_IMAGES = 8;
const PRIVATE_BLOB_HOST = "rwjv07fuxbtccnji.private.blob.vercel-storage.com";

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const headers: HeadersInit = {};
    if (url.includes(PRIVATE_BLOB_HOST) && process.env.BLOB_READ_WRITE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4 * 1024 * 1024) return null;
    const mime = res.headers.get("Content-Type") ?? "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT_BASE = [
  "Tu es l'assistant virtuel d'ImmoMatch, une plateforme immobilière française.",
  "Tu aides les visiteurs à comprendre comment utiliser le site (chercher une annonce, contacter un vendeur, publier un bien), tu réponds à des questions générales sur l'immobilier, et tu peux proposer des annonces pertinentes parmi celles publiées sur le site.",
  "Réponds toujours en français, de manière courte (2 à 5 phrases) et chaleureuse.",
  "Réponds STRICTEMENT en texte brut : pas de markdown, pas de gras (**), pas d'italique (*), pas de titres (#), pas de listes à puces (-) ni numérotées, pas de code (```). Les liens doivent être collés tels quels dans le texte (ex: voir /listings/abc-123).",
  "Tu reçois ci-dessous la liste des annonces actuellement publiées (texte) ET les photos correspondantes (une par annonce). Les photos sont fournies dans l'ordre des annonces — la 1re image correspond à la 1re annonce listée, etc.",
  "Recommandation d'annonces — règles ABSOLUES :",
  "1) N'invente JAMAIS d'annonce qui n'est pas dans la liste ci-dessous.",
  "2) Avant de proposer une annonce, vérifie LIGNE PAR LIGNE qu'elle respecte TOUS les critères donnés par l'utilisateur (prix, ville, type, surface, pièces). Si l'utilisateur dit \"moins de X €\", le prix DOIT être ≤ X. Si l'utilisateur dit \"à Nantes\", la ville DOIT être Nantes.",
  "3) Si la demande contient un détail visuel (banc, piscine, jardin, balcon, terrasse, vue, lumière, parquet, brique, style moderne/ancien, atypique, …), REGARDE les photos fournies pour identifier les annonces qui correspondent visuellement. Combine ces critères visuels avec les critères textuels.",
  "4) Ne propose JAMAIS une annonce qui ne respecte pas un critère, même si elle est proche.",
  "5) Si AUCUNE annonce ne correspond, dis-le honnêtement et invite à élargir la recherche ou à aller voir /annonces. Ne propose rien dans ce cas.",
  "6) Limite-toi à 1 à 3 annonces maximum, et colle leur lien sous la forme /listings/<id>.",
  "Ne donne pas de conseils juridiques ou fiscaux engageants : oriente vers un professionnel si nécessaire.",
].join(" ");

type ListingForPreview = {
  id: string;
  title: string;
  type: string;
  city: string;
  surface: number;
  rooms: number;
  price: number;
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

function buildPreviewPhotoUrl(
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

function buildAiPhotoUrl(
  supabase: SupabaseClient,
  paths: string[],
): string | null {
  if (paths.length === 0) return null;
  const first = paths[0];
  if (first.startsWith("https://")) return first;
  return supabase.storage.from("listings").getPublicUrl(first).data.publicUrl;
}

type ContextResult = {
  byId: Map<string, ListingForPreview>;
  supabase: SupabaseClient;
  listingsText: string;
  imageBlock: Array<{ type: "image_url"; image_url: { url: string } }>;
};

async function fetchListingsContext(): Promise<ContextResult> {
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
      return {
        byId,
        supabase,
        listingsText: "Aucune annonce active pour le moment.",
        imageBlock: [],
      };
    }

    const withPhotoUrl = listings.map((l) => ({
      listing: l,
      aiPhotoUrl: buildAiPhotoUrl(supabase, extractPhotoPaths(l.photos)),
    }));

    const candidates = withPhotoUrl
      .filter((x) => x.aiPhotoUrl)
      .slice(0, MAX_LISTINGS_WITH_IMAGES);
    const dataUrls = await Promise.all(
      candidates.map((x) => fetchImageAsDataUrl(x.aiPhotoUrl!)),
    );
    const withImages = candidates
      .map((x, i) => ({ listing: x.listing, dataUrl: dataUrls[i] }))
      .filter((x): x is { listing: ListingForPreview; dataUrl: string } => x.dataUrl !== null);
    const imageIds = new Set(withImages.map((x) => x.listing.id));
    const others = withPhotoUrl.filter((x) => !imageIds.has(x.listing.id));

    const formatLine = (l: ListingForPreview, hasImage: boolean, idx?: number) => {
      const price = l.price.toLocaleString("fr-FR");
      const prefix = hasImage && idx !== undefined ? `[image ${idx + 1}] ` : "";
      return `${prefix}"${l.title}" — ${l.type}, ${l.city}, ${l.surface} m², ${l.rooms} pièces, ${price} € → /listings/${l.id}`;
    };

    const linesWithImages = withImages.map((x, i) => formatLine(x.listing, true, i));
    const linesOthers = others.map((x) => formatLine(x.listing, false));

    const text = [
      "Annonces actuellement publiées (les premières viennent avec leur 1re photo, dans l'ordre des images jointes) :",
      ...linesWithImages,
      ...(linesOthers.length > 0 ? ["", "Autres annonces sans photo jointe :", ...linesOthers] : []),
    ].join("\n");

    const imageBlock = withImages.map((x) => ({
      type: "image_url" as const,
      image_url: { url: x.dataUrl },
    }));

    return { byId, supabase, listingsText: text, imageBlock };
  } catch {
    return {
      byId: new Map(),
      supabase,
      listingsText: "Liste des annonces indisponible pour le moment.",
      imageBlock: [],
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
      photoUrl: buildPreviewPhotoUrl(supabase, extractPhotoPaths(listing.photos)),
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

  const { byId, supabase, listingsText, imageBlock } = await fetchListingsContext();
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${listingsText}`;

  // Pixtral expects images on a user message, not the system prompt. We attach them
  // to a synthetic priming turn so the model can see them as part of the context.
  const primingTurn =
    imageBlock.length > 0
      ? [
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: "Voici les photos des annonces listées dans le prompt système, dans le même ordre :" },
              ...imageBlock,
            ],
          },
          {
            role: "assistant" as const,
            content: "Bien reçu, j'utiliserai ces photos pour évaluer les critères visuels.",
          },
        ]
      : [];

  const model = imageBlock.length > 0 ? "pixtral-12b-2409" : "mistral-small-latest";

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...primingTurn,
          ...trimmed,
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[chatWithAssistant] Mistral ${res.status}: ${body.slice(0, 500)}`);
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
  } catch (err) {
    console.error("[chatWithAssistant] exception:", err);
    return { error: "L'assistant est momentanément indisponible." };
  }
}
