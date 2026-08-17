import { createClient } from "@supabase/supabase-js";

let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
// Ensure clean base URL without trailing slash or path suffix
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");

const supabaseUrl = rawUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});
