import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type MessageRow = {
  id: string;
  content: string;
  buyer_name: string;
  buyer_email: string;
  created_at: string;
  listings: { title: string } | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, buyer_name, buyer_email, created_at, listings(title)")
    .order("created_at", { ascending: false })
    .overrideTypes<MessageRow[], { merge: false }>();

  const messages = data ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger vos messages. Réessayez plus tard.
        </p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun message reçu pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className="rounded-md border p-4 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                {message.listings?.title ? (
                  <p className="text-sm font-medium">{message.listings.title}</p>
                ) : <span />}
                <time
                  dateTime={message.created_at}
                  className="text-xs text-muted-foreground"
                >
                  {new Date(message.created_at).toLocaleDateString("fr-FR")}
                </time>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs text-muted-foreground">
                <span>{message.buyer_name}</span>
                {" — "}
                <a
                  href={`mailto:${message.buyer_email}`}
                  className="hover:underline"
                >
                  {message.buyer_email}
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
