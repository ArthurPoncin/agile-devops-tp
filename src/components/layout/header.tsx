import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        ImmoMatch
      </Link>
      <nav>
        {user ? (
          <div className="flex items-center gap-4">
            <Link 
              href="/profile" 
              className="text-sm text-muted-foreground hover:text-black dark:hover:text-zinc-50 transition-colors"
            >
              {user.email}
            </Link>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Se déconnecter
              </Button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium hover:underline">
            Se connecter
          </Link>
        )}
      </nav>
    </header>
  );
}
