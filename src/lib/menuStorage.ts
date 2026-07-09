/**
 * Supabase Storage — read menu JSON + image URLs.
 * Buckets: menu-data, menu-images (public read).
 */

import { getSupabase, getSupabaseUrl, isSupabaseConfigured } from './supabase';

export const MENU_DATA_BUCKET = 'menu-data';
export const MENU_IMAGES_BUCKET = 'menu-images';

export function menuJsonPath(truckId: string): string {
  return `${truckId.trim()}/menu.json`;
}

export function menuJsonFullPath(truckId: string): string {
  return `${MENU_DATA_BUCKET}/${menuJsonPath(truckId)}`;
}

export function publicStorageUrl(bucket: string, path: string): string {
  const base = getSupabaseUrl().replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function menuJsonPublicUrl(truckId: string): string {
  return publicStorageUrl(MENU_DATA_BUCKET, menuJsonPath(truckId));
}