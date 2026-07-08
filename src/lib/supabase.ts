/**
 * Supabase client for Cluckin' Chaos.
 *
 * Env (Vite / Vercel) — must match TruckDash project:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ... or sb_publishable_...
 *   VITE_TRUCK_ID=cluckin-chaos
 *
 * Reads public.published_trucks (anon SELECT via RLS).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : ({} as ImportMetaEnv);

const rawUrl = (viteEnv.VITE_SUPABASE_URL as string | undefined) ?? '';
const rawKey = (viteEnv.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

const url = rawUrl.trim().replace(/\/+$/, '');
const anonKey = rawKey.trim();

/** True when URL + anon key are present (client can be created). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && /^https?:\/\//i.test(url));
}

export function getSupabaseUrl(): string {
  return url;
}

/** Masked key for debug UI / console (never log full key). */
export function getMaskedAnonKey(): string {
  if (!anonKey) return '(missing)';
  if (anonKey.length <= 12) return '***';
  return `${anonKey.slice(0, 8)}…${anonKey.slice(-4)}`;
}

let client: SupabaseClient | null = null;

/**
 * Shared Supabase client, or null if env is not configured.
 * Public reads only (anon / publishable key).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // Helps some edge proxies; PostgREST still works without it
          Accept: 'application/json',
        },
      },
    });
    if (import.meta.env.DEV) {
      console.info('[supabase] Client created', {
        url,
        keyPreview: getMaskedAnonKey(),
      });
    }
  }
  return client;
}

export function getSupabaseConfigHint(): string {
  if (isSupabaseConfigured()) {
    return `Connected → ${url} (key ${getMaskedAnonKey()})`;
  }
  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (url && !/^https?:\/\//i.test(url)) missing.push('VITE_SUPABASE_URL (must start with http)');
  return `Missing or invalid: ${missing.join(', ')}. Add to .env.local and restart Vite.`;
}
