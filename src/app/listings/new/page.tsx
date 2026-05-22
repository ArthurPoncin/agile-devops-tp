import { createListing } from "@/lib/listings/actions";
import { ListingForm } from "@/components/listings/listing-form";

export default function NewListingPage() {
  return (
    <main className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Publier une annonce</h1>
          <p className="text-sm text-muted-foreground">
            Renseignez les caracteristiques de votre bien pour le proposer a des acheteurs.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ListingForm action={createListing} />
        </div>
      </div>
    </main>
  );
}
