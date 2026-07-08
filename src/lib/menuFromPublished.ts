/**
 * Map TruckDash published menu → site MenuItem for Live Board + interactive Menu.
 * Enriches with local catalog images/descriptions when names match closely.
 */

import { MENU_ITEMS } from '../data';
import type { MenuItem } from '../types';
import {
  formatMenuPrice,
  inferMenuCategory,
  parseMenuPriceNumber,
  type PublishedMenuItem,
} from './publishedTruck';

import tendersImg from '../assets/images/chicken_tenders_crispy_1782485461920.jpg';
import bbqImg from '../assets/images/bbq_chicken_sandwich_1782485475987.jpg';
import nuggetsImg from '../assets/images/chicken_nuggets_fries_1782485488549.jpg';
import friesImg from '../assets/images/crispy_chaos_fries_1782485776398.jpg';
import hotHoneyImg from '../assets/images/spicy_hot_honey_1782486510998.jpg';
import lemonadeImg from '../assets/images/fresh_lemonade_1782487246710.jpg';
import sodaImg from '../assets/images/soda_cans_1782487271435.jpg';
import waterImg from '../assets/images/bottled_water_1782487258935.jpg';
import truckImg from '../assets/images/chaos_food_truck_1782485499263.jpg';

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Find a static catalog item whose name roughly matches the published line. */
function findLocalMatch(name: string): MenuItem | undefined {
  const n = normalizeName(name);
  if (!n) return undefined;

  // Exact / includes either way
  const exact = MENU_ITEMS.find((item) => {
    const local = normalizeName(item.name);
    return local === n || local.includes(n) || n.includes(local);
  });
  if (exact) return exact;

  // Token overlap (at least 2 meaningful tokens shared)
  const tokens = n.split(' ').filter((t) => t.length > 2);
  if (tokens.length === 0) return undefined;

  let best: MenuItem | undefined;
  let bestScore = 0;
  for (const item of MENU_ITEMS) {
    const localTokens = normalizeName(item.name).split(' ').filter((t) => t.length > 2);
    const score = tokens.filter((t) => localTokens.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 ? best : undefined;
}

/** Fallback image by inferred category / keywords when no local match. */
function fallbackImage(name: string, category: MenuItem['category']): string {
  const n = name.toLowerCase();
  if (/\b(tea|lemonade)\b/.test(n)) return lemonadeImg;
  if (/\b(soda|coke|pepsi|sprite)\b/.test(n)) return sodaImg;
  if (/\bwater\b/.test(n)) return waterImg;
  if (/\b(fries|chips)\b/.test(n)) return friesImg;
  if (/\b(nugget)\b/.test(n)) return nuggetsImg;
  if (/\b(tender|strip)\b/.test(n)) return tendersImg;
  if (/\b(sandwich|bbq|pulled|pork|brisket)\b/.test(n)) return bbqImg;
  if (/\b(honey|hot|spicy)\b/.test(n)) return hotHoneyImg;
  if (category === 'drinks') return lemonadeImg;
  if (category === 'sides') return friesImg;
  return truckImg;
}

/**
 * Convert a TruckDash published menu line into a full site MenuItem
 * (prices as numbers, images, descriptions when available).
 */
export function publishedItemToMenuItem(item: PublishedMenuItem, index = 0): MenuItem {
  const local = findLocalMatch(item.name);
  const category = inferMenuCategory(item.name, item.category);
  const price = parseMenuPriceNumber(item.price) || local?.price || 0;

  const description =
    item.description?.trim() ||
    item.note?.trim() ||
    local?.description ||
    `Fresh from the truck — ${item.name}. Hand-prepped with Kentucky soul.`;

  const tags =
    item.tags && item.tags.length > 0
      ? item.tags
      : local?.tags || ['Live from TruckDash', category === 'mains' ? 'Fresh Fry' : category === 'drinks' ? 'Ice Cold' : 'Side Kick'];

  return {
    id: item.id || `published-${index}`,
    name: item.name,
    price,
    description,
    category: local?.category || category,
    image: item.image || local?.image || fallbackImage(item.name, category),
    tags,
    chaosLevel: local?.chaosLevel ?? (category === 'mains' ? 2 : 0),
  };
}

export function publishedMenuToMenuItems(menu: PublishedMenuItem[]): MenuItem[] {
  return menu.map((item, i) => publishedItemToMenuItem(item, i));
}

/** Display helper: price label for a MenuItem. */
export function menuItemPriceLabel(item: MenuItem): string {
  return formatMenuPrice(String(item.price));
}
