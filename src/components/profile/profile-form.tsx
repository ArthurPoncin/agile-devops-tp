"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileData, UpdateProfileResult } from "@/lib/profile/actions";

type ProfileFormState =
  | { error: string }
  | { success: true; emailChangePending: boolean }
  | null;

type UpdateProfileAction = (formData: FormData) => Promise<UpdateProfileResult>;

export function ProfileForm({
  initialProfile,
  action,
}: {
  initialProfile: ProfileData;
  action: UpdateProfileAction;
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      if ("error" in result) {
        return { error: result.error };
      }
      return { success: true, emailChangePending: result.emailChangePending };
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={initialProfile.full_name}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={initialProfile.email}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={initialProfile.phone}
          placeholder="06 12 34 56 78"
        />
      </div>
      {state && "error" in state ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.emailChangePending
            ? "Profil mis à jour. Confirmez la modification d'email via le lien envoyé à votre nouvelle adresse."
            : "Profil mis à jour."}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
