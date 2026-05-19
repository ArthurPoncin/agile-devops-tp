"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteState = { ok: true } | { error: string } | null;
type DeleteAction = (formData: FormData) => Promise<{ ok: true } | { error: string }>;

export function DeleteListingDialog({
  listingId,
  action,
}: {
  listingId: string;
  action: DeleteAction;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DeleteState, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      if ("ok" in result && result.ok) {
        setOpen(false);
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive">Supprimer</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Cette action est définitive. L&apos;annonce sera retirée et ne pourra plus être consultée.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="id" value={listingId} />
          {state && "error" in state ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button">Annuler</Button>} />
            <Button type="submit" variant="destructive" disabled={pending}>
              Supprimer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
