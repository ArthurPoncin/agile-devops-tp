import { createListing } from "@/lib/listings/actions";
import { ListingForm } from "@/components/listings/listing-form";

export default function NewListingPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Publier une annonce</h1>
          <p className="text-sm text-muted-foreground">
            Renseignez les caractéristiques de votre bien pour le proposer à des acheteurs.
          </p>
        </div>
        <ListingForm action={createListing} />
      </div>
    </main>
  );
}
