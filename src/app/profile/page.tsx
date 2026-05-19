import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { getProfile, updateProfile } from "@/lib/profile/actions";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 py-12 dark:bg-black">
      <main className="w-full max-w-2xl px-6">
        <div className="space-y-2 pb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
          <p className="text-sm text-muted-foreground">
            Consultez et mettez à jour vos informations personnelles.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 dark:bg-zinc-950">
          <ProfileForm initialProfile={profile} action={updateProfile} />
        </div>

        <div className="mt-8 flex justify-end">
          <form action={logout}>
            <Button type="submit" variant="outline">
              Se déconnecter
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
