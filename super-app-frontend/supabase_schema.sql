-- Chạy script này trong SQL Editor của Supabase để khởi tạo bảng usage_logs

CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_agent TEXT NOT NULL
);

-- Bật Row Level Security nếu cần bảo mật, hiện tại đang open for all để insert
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Cấp quyền ẩn danh cho bảng (nếu gọi từ Next.js Client hoặc Server không dùng Service Role Key)
CREATE POLICY "Cho phép mọi người insert log" ON public.usage_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cho phép mọi người đọc log" ON public.usage_logs
    FOR SELECT USING (true);
