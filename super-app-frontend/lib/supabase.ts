import { createClient } from '@supabase/supabase-js'

// [S1-FIX] Xóa hardcode fallback Anon Key — key cũ đã bị lộ trong Git history
// Nếu thiếu env var, throw lỗi rõ ràng thay vì silently dùng key hardcode trong source code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
