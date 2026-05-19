import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            Renseignez vos informations pour rejoindre la plateforme.
          </p>
        </div>
        <SignupForm action={signup} />
        <p className="text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
