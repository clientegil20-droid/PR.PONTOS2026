-- 1. Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    hire_date TEXT,
    status TEXT DEFAULT 'active',
    hourly_rate NUMERIC,
    overtime_rate NUMERIC,
    daily_hours NUMERIC,
    avatar_url TEXT,
    base_salary NUMERIC DEFAULT 0,
    work_days JSONB -- Stores array of day numbers [0,1,2,3,4,5,6]
);

-- 2. Create Time Logs Table
CREATE TABLE IF NOT EXISTS public.time_logs (
    id TEXT PRIMARY KEY, -- using string ID from frontend
    employee_id TEXT REFERENCES public.employees(id),
    employee_name TEXT,
    timestamp TIMESTAMPTZ,
    type TEXT, -- 'IN' or 'OUT'
    photo_base64 TEXT,
    verification_message TEXT,
    is_verified BOOLEAN
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow anonymous access for demonstration/kiosk mode
-- WARNING: In a real production app with auth, you would restrict these.

-- Policies for employees
CREATE POLICY "Enable read access for all users" ON public.employees
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.employees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.employees
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.employees
    FOR DELETE USING (true);

-- Policies for time_logs
CREATE POLICY "Enable read access for all users" ON public.time_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.time_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON public.time_logs
    FOR DELETE USING (true);

-- 5. Migration Script (Run this if the table already exists)
-- ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0;
-- ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_days JSONB;
