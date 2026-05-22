import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { updateListing } from "@/lib/listings/actions";
import { ListingForm } from "@/components/listings/listing-form";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!listing) {
    notFound();
  }

  const updateListingWithId = updateListing.bind(null, id);

  return (
    <main className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Modifier l&apos;annonce</h1>
          <p className="text-sm text-muted-foreground">
            Modifiez les informations de votre bien immobilier.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ListingForm action={updateListingWithId} initialData={listing} />
        </div>
      </div>
    </main>
  );
}