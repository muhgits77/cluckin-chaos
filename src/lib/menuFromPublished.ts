/**
 * Map Supabase published menu → site MenuItem for Live Board + Menu.
 */

import { MENU_ITEMS } from '../data';
import type { MenuItem } from '../types';
import {
  formatMenuPrice,
  inferMenuCategory,
  menuItemSiteId,
  normalizeName,
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

export { menuItemSiteId as publishedItemToSiteId };

function catalogImage(name: string, category: MenuItem['category']): string {
  const n = name.toLowerCase();
  if (/tea|lemonade/.test(n)) return lemonadeImg;
  if (/soda|coke|pepsi|sprite/.test(n)) return sodaImg;
  if (/water/.test(n)) return waterImg;
  if (/fries|chips/.test(n)) return friesImg;
  if (/nugget/.test(n)) return nuggetsImg;
  if (/tender|strip/.test(n)) return tendersImg;
  if (/sandwich|bbq|pulled|pork/.test(n)) return bbqImg;
  if (/honey|hot|spicy/.test(n)) return hotHoneyImg;
  if (category === 'drinks') return lemonadeImg;
  if (category === 'sides') return friesImg;
  return truckImg;
}

function catalogMatch(name: string): MenuItem | undefined {
  const n = normalizeName(name);
  return MENU_ITEMS.find((item) => normalizeName(item.name) === n);
}

export function publishedItemToMenuItem(item: PublishedMenuItem): MenuItem {
  const name = item.name.trim();
  const catalog = catalogMatch(name);
  const category = item.category
    ? inferMenuCategory(name, item.category)
    : catalog?.category ?? inferMenuCategory(name);

  const price = parseMenuPriceNumber(item.price);

  return {
    id: menuItemSiteId(item),
    name,
    price,
    description:
      item.description?.trim() ||
      item.note?.trim() ||
      catalog?.description ||
      `Fresh from the truck — ${name}.`,
    category,
    // TruckDash uploads photos to menu-images bucket; URL is in JSON
    image: item.image?.trim() || catalog?.image || catalogImage(name, category),
    tags: item.tags?.length
      ? item.tags
      : ['Live from TruckDash'],
    chaosLevel: catalog?.chaosLevel ?? (category === 'mains' ? 2 : 0),
  };
}

export function publishedMenuToMenuItems(menu: PublishedMenuItem[]): MenuItem[] {
  if (!menu.length) return [];
  return menu.map(publishedItemToMenuItem);
}

export function menuItemPriceLabel(item: MenuItem): string {
  return formatMenuPrice(item.price);
}