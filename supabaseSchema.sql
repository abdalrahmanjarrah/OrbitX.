-- =========================================================================
-- ORBITX SUPABASE DATABASE SCHEMA MIGRATION SCRIPT
-- =========================================================================
-- Description: This script sets up a highly optimized, fully compatible
-- NoSQL-on-PostgreSQL compatibility layer using JSONB storage.
-- It maps all hierarchical Firestore collections (including subcollections)
-- onto a single high-performance 'documents' table.
--
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com
-- 2. Select your OrbitX project.
-- 3. Click on "SQL Editor" in the left-hand sidebar navigation.
-- 4. Create a "New Query", paste this entire script, and click "Run".
-- =========================================================================

-- 1. Create the unified documents table
CREATE TABLE IF NOT EXISTS public.documents (
    path TEXT PRIMARY KEY,                       -- Full unique path of document (e.g. "users/123", "rooms/room_abc/messages/msg_xyz")
    collection TEXT NOT NULL,                    -- The parent collection name (e.g. "users", "global_chat", "messages")
    id TEXT NOT NULL,                            -- Only the document ID portion (e.g. "123", "msg_xyz")
    data JSONB NOT NULL DEFAULT '{}'::jsonb,     -- Flexible document fields stored as high-performance binary JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add high-performance indexes
-- Index for lightning-fast queries by collection (e.g. fetching all posts in global_chat)
CREATE INDEX IF NOT EXISTS idx_documents_collection ON public.documents(collection);

-- GIN (Generalized Inverted Index) for high-performance key searches inside JSONB data fields (e.g., where 'userId' == 'xyz')
CREATE INDEX IF NOT EXISTS idx_documents_data_gin ON public.documents USING gin (data);

-- 3. Enable Realtime Replication for the table
-- This enables live instant chat updates, active study room timers, and visual focus metrics!
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Define access policies for the compat layer
-- Read Policy: Allow anyone (anonymous or authenticated) to read data for testing and seamless transition
CREATE POLICY "Allow public read access" 
ON public.documents 
FOR SELECT 
USING (true);

-- Insert/Update/Delete Policy: Allow anyone to perform mutations
CREATE POLICY "Allow public write mutations" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update mutations" 
ON public.documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete mutations" 
ON public.documents 
FOR DELETE 
USING (true);

-- 6. Automatically update 'updated_at' column on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_update_documents_timestamp
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Done! Your Supabase Postgres database is now ready for OrbitX.
-- =========================================================================
