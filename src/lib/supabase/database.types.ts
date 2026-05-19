export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          type: Database["public"]["Enums"]["listing_type"];
          city: string;
          surface: number;
          rooms: number;
          price: number;
          description: string | null;
          photos: Json;
          status: Database["public"]["Enums"]["listing_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          type: Database["public"]["Enums"]["listing_type"];
          city: string;
          surface: number;
          rooms: number;
          price: number;
          description?: string | null;
          photos?: Json;
          status?: Database["public"]["Enums"]["listing_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          type?: Database["public"]["Enums"]["listing_type"];
          city?: string;
          surface?: number;
          rooms?: number;
          price?: number;
          description?: string | null;
          photos?: Json;
          status?: Database["public"]["Enums"]["listing_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string | null;
          buyer_name: string;
          buyer_email: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id?: string | null;
          buyer_name: string;
          buyer_email: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string | null;
          buyer_name?: string;
          buyer_email?: string;
          content?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Enums: {
      listing_type: "maison" | "appartement";
      listing_status: "active" | "archived";
    };
  };
};

// ============================================================
// Helpers pratiques pour les composants / queries
// ============================================================

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

// Raccourcis nommés (utilisables directement dans le code feature)
export type Profile = Tables<"profiles">;
export type Listing = Tables<"listings">;
export type Favorite = Tables<"favorites">;
export type Message = Tables<"messages">;

export type ProfileInsert = TablesInsert<"profiles">;
export type ListingInsert = TablesInsert<"listings">;
export type FavoriteInsert = TablesInsert<"favorites">;
export type MessageInsert = TablesInsert<"messages">;

export type ListingType = Enums<"listing_type">;
export type ListingStatus = Enums<"listing_status">;
