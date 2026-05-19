import Image from "next/image";

export default function ProfilePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col justify-between py-16 px-6 bg-white dark:bg-black sm:px-16">
        <div className="w-full space-y-8">
          <div className="flex flex-col items-center gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-800 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <Image
                src="/avatar-placeholder.svg"
                alt="Avatar de l'utilisateur"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                Mon Profil
              </h1>
              <p className="text-sm text-muted-foreground">
                Gérez vos informations personnelles et les paramètres de votre compte.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 p-5 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Nom complet
                </p>
                <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                  Alexandre Dupont
                </p>
              </div>

              <div className="rounded-xl border border-zinc-100 p-5 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Adresse email
                </p>
                <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                  alexandre.dupont@example.com
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 p-5 dark:border-zinc-800">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Rôle de l'utilisateur
              </p>
              <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
                Développeur
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 text-base font-medium sm:flex-row sm:justify-end">
          <button className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]">
            Modifier les informations
          </button>
          <button className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
            Déconnexion
          </button>
        </div>
      </main>
    </div>
  );
}