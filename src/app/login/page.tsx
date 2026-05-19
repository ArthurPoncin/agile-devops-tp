import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email et votre mot de passe pour accéder à votre espace.
          </p>
        </div>
        <LoginForm action={login} />
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
