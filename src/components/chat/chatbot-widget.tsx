"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Loader2, MapPin, Maximize2, BedDouble } from "lucide-react";
import {
  chatWithAssistant,
  type ChatMessage,
  type ReferencedListing,
} from "@/lib/ai/chat";
import { cn } from "@/lib/utils";

const LINK_PATTERN = /(https?:\/\/[^\s)]+|\/listings\/[a-f0-9-]{8,})/gi;

function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} €`;
}

function ListingPreview({
  listing,
  onClick,
}: {
  listing: ReferencedListing;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      onClick={onClick}
      className="mt-2 block overflow-hidden rounded-xl border bg-background text-foreground transition-shadow hover:shadow-md"
    >
      <div className="flex">
        <div className="relative h-24 w-24 shrink-0 bg-muted">
          {listing.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              Pas de photo
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{listing.title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{listing.city}</span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Maximize2 className="size-3" />
                {listing.surface} m²
              </span>
              <span className="flex items-center gap-0.5">
                <BedDouble className="size-3" />
                {listing.rooms}
              </span>
            </div>
            <span className="font-semibold text-primary">{formatPrice(listing.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function renderMessageText(text: string, onLinkClick: () => void): React.ReactNode[] {
  const parts = text.split(LINK_PATTERN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (i % 2 === 1) {
      // We render listing IDs as cards below the text, so skip them here.
      if (part.startsWith("/listings/")) return null;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 font-medium hover:opacity-80"
          onClick={onLinkClick}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function stripListingLinks(text: string): string {
  return text.replace(LINK_PATTERN, (match) =>
    match.startsWith("/listings/") ? "" : match,
  );
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'assistant ImmoMatch. Je peux vous aider à naviguer sur le site ou répondre à vos questions immobilières. Que cherchez-vous ?",
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);

    const result = await chatWithAssistant(next);
    setPending(false);

    if ("error" in result) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${result.error}` }]);
      return;
    }
    setMessages((m) => [
      ...m,
      { role: "assistant", content: result.reply, listings: result.listings },
    ]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const closePanel = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
          open && "rotate-90",
        )}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Assistant ImmoMatch"
          className="fixed bottom-24 right-5 z-50 flex h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
              <MessageCircle className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Assistant ImmoMatch</span>
              <span className="text-xs opacity-80">Propulsé par Mistral AI</span>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-background"
          >
            {messages.map((m, i) => {
              const isAssistant = m.role === "assistant";
              const displayText = isAssistant
                ? stripListingLinks(m.content).replace(/\s+\n/g, "\n").trim()
                : m.content;
              return (
                <div
                  key={i}
                  className={cn("flex", isAssistant ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      isAssistant
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm",
                    )}
                  >
                    {isAssistant ? renderMessageText(displayText, closePanel) : displayText}
                    {isAssistant && m.listings && m.listings.length > 0 && (
                      <div className="space-y-2">
                        {m.listings.map((l) => (
                          <ListingPreview key={l.id} listing={l} onClick={closePanel} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {pending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>L&apos;assistant réfléchit…</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t bg-card px-3 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Posez votre question…"
              disabled={pending}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              disabled={pending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
