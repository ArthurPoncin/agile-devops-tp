"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMessage } from "@/lib/messages/actions";

interface ContactFormDialogProps {
  listingId: string;
  defaultEmail?: string;
  defaultName?: string;
}

export function ContactFormDialog({ listingId, defaultEmail = "", defaultName = "" }: ContactFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await sendMessage(listingId, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000); // Ferme la modal après 2 secondes de succès
      }
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        Contacter le vendeur
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Envoyer un message</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            {success ? (
              <p className="py-4 text-center text-sm text-green-600 dark:text-green-400">
                Votre message a été envoyé avec succès !
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="buyerName">Votre nom</Label>
                  <Input
                    id="buyerName"
                    name="buyerName"
                    type="text"
                    required
                    defaultValue={defaultName}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="buyerEmail">Votre adresse email</Label>
                  <Input
                    id="buyerEmail"
                    name="buyerEmail"
                    type="email"
                    required
                    defaultValue={defaultEmail}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="content">Votre message</Label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={4}
                    placeholder="Bonjour, votre bien m'intéresse..."
                    className="border-input bg-transparent flex w-full rounded-md border px-3 py-2 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}