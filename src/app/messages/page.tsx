import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationCard, type ConversationMessage } from "@/components/messages/conversation-card";

type RawMessage = {
  id: string;
  content: string;
  buyer_name: string;
  buyer_email: string;
  buyer_id: string | null;
  created_at: string;
  read: boolean;
  sender_type: "buyer" | "seller";
  listing_id: string;
  listings: { title: string; owner_id: string } | null;
};

type Conversation = {
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerId: string | null;
  messages: ConversationMessage[];
  unreadCount: number;
};

function groupConversations(messages: RawMessage[], ownerId: string): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const msg of messages) {
    const key = `${msg.listing_id}:${msg.buyer_email}`;
    if (!map.has(key)) {
      map.set(key, {
        listingId: msg.listing_id,
        listingTitle: msg.listings?.title ?? "",
        buyerName: msg.buyer_name,
        buyerEmail: msg.buyer_email,
        buyerId: msg.buyer_id,
        messages: [],
        unreadCount: 0,
      });
    }
    const conv = map.get(key)!;
    conv.messages.push({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      read: msg.read,
      sender_type: msg.sender_type,
    });
    if (!msg.read && msg.sender_type === "buyer" && msg.listings?.owner_id === ownerId) {
      conv.unreadCount++;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const lastA = a.messages.at(-1)!.created_at;
    const lastB = b.messages.at(-1)!.created_at;
    return new Date(lastB).getTime() - new Date(lastA).getTime();
  });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, buyer_name, buyer_email, buyer_id, created_at, read, sender_type, listing_id, listings(title, owner_id)")
    .order("created_at", { ascending: true })
    .overrideTypes<RawMessage[], { merge: false }>();

  const allMessages = data ?? [];

  // Conversations où je suis le vendeur (listing m'appartient)
  const sellerMessages = allMessages.filter((m) => m.listings?.owner_id === user.id);
  const sellerConversations = groupConversations(sellerMessages, user.id);

  // Conversations où je suis l'acheteur (sur les annonces des autres)
  const buyerMessages = allMessages.filter(
    (m) => m.buyer_id === user.id && m.listings?.owner_id !== user.id,
  );
  const buyerConversations = groupConversations(buyerMessages, user.id);

  const totalUnread = sellerConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        {totalUnread > 0 && (
          <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
            {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          Impossible de charger vos messages. Réessayez plus tard.
        </p>
      )}

      {/* Boîte de réception (vendeur) */}
      {!error && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Boîte de réception
          </h2>
          {sellerConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun message reçu pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {sellerConversations.map((conv) => (
                <ConversationCard
                  key={`${conv.listingId}:${conv.buyerEmail}`}
                  listingId={conv.listingId}
                  listingTitle={conv.listingTitle}
                  buyerName={conv.buyerName}
                  buyerEmail={conv.buyerEmail}
                  buyerId={conv.buyerId}
                  messages={conv.messages}
                  unreadCount={conv.unreadCount}
                  isSeller={true}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Conversations envoyées (acheteur) */}
      {!error && buyerConversations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Mes conversations
          </h2>
          <ul className="space-y-2">
            {buyerConversations.map((conv) => (
              <ConversationCard
                key={`buyer:${conv.listingId}:${conv.buyerEmail}`}
                listingId={conv.listingId}
                listingTitle={conv.listingTitle}
                buyerName={conv.buyerName}
                buyerEmail={conv.buyerEmail}
                buyerId={conv.buyerId}
                messages={conv.messages}
                unreadCount={0}
                isSeller={false}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
