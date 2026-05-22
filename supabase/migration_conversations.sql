-- ============================================================
-- Migration : Système de conversations (chat bidirectionnel)
-- À coller dans Supabase SQL Editor → Run
-- ============================================================

-- 1. Colonne sender_type pour distinguer acheteur / vendeur
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sender_type text NOT NULL DEFAULT 'buyer'
CHECK (sender_type IN ('buyer', 'seller'));

-- 2. Permettre à l'acheteur de lire ses propres conversations
--    (les réponses du vendeur ont buyer_id = l'acheteur → visibles par les deux parties)
CREATE POLICY "Lecture par l'acheteur (ses conversations)"
  ON public.messages FOR SELECT
  USING (auth.uid() = buyer_id);
