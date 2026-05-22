"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { markConversationRead, sendReply, sendBuyerReply } from "@/lib/messages/actions";

export type ConversationMessage = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_type: "buyer" | "seller";
};

type ConversationCardProps = {
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerId: string | null;
  messages: ConversationMessage[];
  unreadCount: number;
  isSeller: boolean;
};

export function ConversationCard({
  listingId,
  listingTitle,
  buyerName,
  buyerEmail,
  buyerId,
  messages: initialMessages,
  unreadCount: initialUnread,
  isSeller,
}: ConversationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [reply, setReply] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function openDialog() {
    setIsOpen(true);
    if (isSeller && unreadCount > 0) {
      setUnreadCount(0);
      setMessages((prev) => prev.map((m) => (m.sender_type === "buyer" ? { ...m, read: true } : m)));
      startTransition(() => markConversationRead(listingId, buyerEmail));
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = reply.trim();
    if (!content) return;

    setSendError(null);
    setReply("");

    const optimistic: ConversationMessage = {
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
      read: isSeller,
      sender_type: isSeller ? "seller" : "buyer",
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const res = isSeller
        ? await sendReply(listingId, buyerEmail, buyerName, buyerId, content)
        : await sendBuyerReply(listingId, buyerEmail, buyerName, content);

      if (res?.error) {
        setSendError(res.error);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setReply(content);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  return (
    <>
      {/* Conversation card */}
      <li
        onClick={openDialog}
        className={`cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/40 ${
          unreadCount > 0 ? "border-l-4 border-l-accent bg-accent/5" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm truncate ${unreadCount > 0 ? "font-semibold" : "font-medium"}`}>
                {isSeller ? buyerName : listingTitle}
              </p>
              {unreadCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSeller ? listingTitle : `De : ${buyerEmail}`}
            </p>
            {lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {lastMessage.sender_type === "seller" ? "Vous : " : ""}
                {lastMessage.content}
              </p>
            )}
          </div>
          {lastMessage && (
            <time className="text-xs text-muted-foreground shrink-0">
              {new Date(lastMessage.created_at).toLocaleDateString("fr-FR")}
            </time>
          )}
        </div>
      </li>

      {/* Chat dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="flex h-[600px] w-full max-w-lg flex-col rounded-xl border bg-white shadow-xl dark:bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {isSeller ? buyerName : listingTitle}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isSeller ? listingTitle : buyerEmail}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto space-y-2 px-4 py-3">
              {messages
                .slice()
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((msg) => {
                  const isMine = isSeller
                    ? msg.sender_type === "seller"
                    : msg.sender_type === "buyer";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          isMine
                            ? "rounded-br-sm bg-accent text-white"
                            : "rounded-bl-sm bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <time
                          className={`mt-0.5 block text-[10px] ${
                            isMine ? "text-white/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <form onSubmit={handleSend} className="border-t p-3 space-y-2">
              {sendError && (
                <p className="text-xs text-destructive">{sendError}</p>
              )}
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Votre message… (Entrée pour envoyer)"
                  rows={2}
                  className="flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!reply.trim()}
                  className="shrink-0"
                >
                  Envoyer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
