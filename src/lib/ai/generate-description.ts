"use server";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type ContentPart = TextPart | ImagePart;

type Input = {
  title?: string;
  type: string;
  city: string;
  surface: string;
  rooms: string;
  price: string;
  images?: string[];
};

export async function generateDescription(
  input: Input,
): Promise<{ description: string } | { error: string }> {
  const { title, type, city, surface, rooms, price, images = [] } = input;

  if (!type || !city || !surface || !rooms || !price) {
    return { error: "Remplissez le type, la ville, la surface, les pièces et le prix avant de générer." };
  }

  const hasImages = images.length > 0;
  const model = hasImages ? "pixtral-12b-2409" : "mistral-small-latest";

  const lines = [
    title && `Titre : ${title}`,
    `Type : ${type}`,
    `Ville : ${city}`,
    `Surface : ${surface} m²`,
    `Pièces : ${rooms}`,
    `Prix : ${parseInt(price, 10).toLocaleString("fr-FR")} €`,
  ]
    .filter(Boolean)
    .join("\n");

  const userText = [
    "Tu es un agent immobilier expert.",
    "Voici les informations du bien :",
    lines,
    "",
    hasImages
      ? "Observe les photos ci-jointes pour enrichir ta description avec des détails concrets sur la luminosité, le style, les matériaux et l'ambiance générale."
      : "",
    "Rédige une description commerciale de 3 à 4 phrases en français, fluide et attractive, qui donne envie de visiter.",
    "Règles absolues : texte brut uniquement, aucun titre, aucune section, aucun symbole de formatage (pas de **, *, #, -, ou autres), pas de listes. Réponds avec seulement la description, rien d'autre.",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  const content: string | ContentPart[] = hasImages
    ? [
        { type: "text", text: userText } satisfies TextPart,
        ...images.map((url): ImagePart => ({ type: "image_url", image_url: { url } })),
      ]
    : userText;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return { error: "Impossible de générer la description." };
    }

    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content?.trim() ?? "";
    const text = raw.replace(/\*{1,2}([^*]*)\*{1,2}/g, "$1").replace(/#{1,6}\s*/g, "").trim();

    if (!text) {
      return { error: "Impossible de générer la description." };
    }

    return { description: text };
  } catch {
    return { error: "Impossible de générer la description." };
  }
}
