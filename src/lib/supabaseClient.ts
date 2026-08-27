import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const configuredSupabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * The public Supabase URL and anon/publishable key are embedded into the Vite
 * bundle at build time. A missing value must never prevent React from mounting:
 * this fallback keeps the shell renderable so the configuration problem can be
 * diagnosed instead of producing a blank Android WebView.
 */
export const isSupabaseConfigured = Boolean(
  configuredSupabaseUrl && configuredSupabaseAnonKey,
);

const supabaseUrl = configuredSupabaseUrl || 'https://placeholder.invalid';
const supabaseAnonKey = configuredSupabaseAnonKey || 'saki-chat-missing-supabase-key';

if (!isSupabaseConfigured) {
  console.error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before building the app.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
