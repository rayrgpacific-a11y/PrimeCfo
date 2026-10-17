-- ==============================================================================
-- PrimeCFO.ai - Supabase PostgreSQL Schema (Mirrored with Prisma)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    client_type TEXT,
    is_active BOOLEAN DEFAULT true,
    qbo_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUICKBOOKS CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.client_qbo_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    company_id TEXT NOT NULL,
    customer_id TEXT,
    realm_id TEXT,
    sync_enabled BOOLEAN DEFAULT false,
    sandbox_mode BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUICKBOOKS TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.qbo_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID UNIQUE REFERENCES public.clients(client_id) ON DELETE CASCADE,
    company_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ASSET REGISTER & DEPRECIATION TABLE
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'fixed',
    subcategory TEXT,
    purchase_date TEXT,
    purchase_price DOUBLE PRECISION DEFAULT 0,
    current_value DOUBLE PRECISION DEFAULT 0,
    depreciation_method TEXT DEFAULT 'straight-line',
    useful_life INTEGER DEFAULT 5,
    salvage_value DOUBLE PRECISION DEFAULT 0,
    location TEXT,
    serial_number TEXT,
    vendor TEXT,
    warranty TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCIAL METRICS & PERIOD DIGESTS TABLE
CREATE TABLE IF NOT EXISTS public.financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    period TEXT DEFAULT '30d',
    cash_position DOUBLE PRECISION DEFAULT 0,
    revenue DOUBLE PRECISION DEFAULT 0,
    net_profit DOUBLE PRECISION DEFAULT 0,
    profit_margin DOUBLE PRECISION DEFAULT 0,
    ar_aging DOUBLE PRECISION DEFAULT 0,
    cash_runway DOUBLE PRECISION DEFAULT 0,
    basis TEXT DEFAULT 'cash',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANCIAL ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.financial_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    severity TEXT DEFAULT 'warning',
    category TEXT DEFAULT 'Cash Horizon',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_required BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CFO ADVISORY NOTES TABLE
CREATE TABLE IF NOT EXISTS public.advisory_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'CFO Lead',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CFO ACTION ITEMS / TASKS TABLE
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DOCUMENTS VAULT TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT DEFAULT 'General',
    size TEXT,
    source TEXT DEFAULT 'Uploaded',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INDEXES FOR HIGH-THROUGHPUT RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_connections_client_id ON public.client_qbo_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_tokens_client_id ON public.qbo_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_assets_client_id ON public.assets(client_id);
CREATE INDEX IF NOT EXISTS idx_metrics_client_id ON public.financial_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON public.financial_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON public.advisory_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_action_items_client_id ON public.action_items(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_qbo_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qbo_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
