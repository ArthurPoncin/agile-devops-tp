import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS: { href: string; label: string; authOnly?: boolean }[] = [
  { href: "/annonces", label: "Annonces" },
  { href: "/mes-annonces", label: "Mes annonces", authOnly: true },
  { href: "/messages", label: "Messages", authOnly: true },
  { href: "/listings/new", label: "Publier", authOnly: true },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visibleLinks = NAV_LINKS.filter((l) => !l.authOnly || user);

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-3">
        <Link href="/" className="font-semibold shrink-0">
          ImmoMatch
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {user.email}
              </Link>
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Se déconnecter
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:underline">
                Se connecter
              </Link>
              <Link href="/signup" className="text-sm font-medium hover:underline">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
