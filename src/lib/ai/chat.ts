"use server";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = [
  "Tu es l'assistant virtuel d'ImmoMatch, une plateforme immobilière française.",
  "Tu aides les visiteurs à comprendre comment utiliser le site (chercher une annonce, contacter un vendeur, publier un bien) et à répondre à des questions générales sur l'immobilier (budget, démarches, conseils).",
  "Réponds toujours en français, de manière courte (2-4 phrases), chaleureuse et concrète.",
  "N'invente jamais d'annonces, de prix précis ni de chiffres officiels. Si tu ne sais pas, dis-le et invite l'utilisateur à explorer le site ou à contacter un vendeur via la messagerie.",
  "Ne donne pas de conseils juridiques ou fiscaux engageants : oriente vers un professionnel si nécessaire.",
].join(" ");

export async function chatWithAssistant(
  history: ChatMessage[],
): Promise<{ reply: string } | { error: string }> {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return { error: "Message vide." };
  }

  const trimmed = history
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

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
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      return { error: "L'assistant est momentanément indisponible." };
    }

    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      return { error: "Pas de réponse, réessayez." };
    }

    return { reply };
  } catch {
    return { error: "L'assistant est momentanément indisponible." };
  }
}
