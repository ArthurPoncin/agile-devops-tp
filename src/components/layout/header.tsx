import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Home, Search, List, Inbox, PlusCircle, User, LogOut } from "lucide-react";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("read", false)
      .eq("sender_type", "buyer");
    unreadCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Home className="size-5 text-accent" />
            <span>
              Immo<span className="text-accent">Match</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/annonces"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Search className="size-3.5" />
                Annonces
              </Link>
              <Link
                href="/mes-annonces"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <List className="size-3.5" />
                Mes annonces
              </Link>
              <Link
                href="/messages"
                className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Inbox className="size-3.5" />
                Messages
                {unreadCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/listings/new"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                <PlusCircle className="size-3.5" />
                Publier
              </Link>
            </nav>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <User className="size-3.5" />
                </div>
                <span className="hidden md:inline">{user.email}</span>
              </Link>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Se déconnecter</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ size: "sm" })}
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
