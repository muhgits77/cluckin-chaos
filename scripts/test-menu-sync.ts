/**
 * Menu sync tests — add / edit / delete / price change (JSON parsing).
 * Run: npx tsx scripts/test-menu-sync.ts
 */

import {
  diffMenu,
  menuItemKey,
  menuItemSiteId,
  parseMenu,
  type PublishedMenuItem,
} from '../src/lib/publishedTruck.ts';

function assert(ok: boolean, msg: string) {
  if (!ok) throw new Error(msg);
}

const base: PublishedMenuItem[] = [
  { id: '1', name: 'Pulled Pork Sandwich', price: '10', description: 'Smoky' },
  { id: '2', name: 'Bourbon Nachos', price: '12' },
  { id: '3', name: 'Sweet Tea', price: '3' },
];

console.log('── parseMenu ──');
assert(parseMenu(base).length === 3, 'parse 3 items');
console.log('  ✓ parses menu array');

console.log('── delete ──');
{
  const after = base.filter((m) => m.id !== '2');
  const d = diffMenu(base, after);
  assert(d.removed.includes('Bourbon Nachos'), 'detect delete');
  assert(parseMenu(after).length === 2, '2 items left');
  console.log('  ✓ delete');
}

console.log('── price change ──');
{
  const after = base.map((m) => (m.id === '3' ? { ...m, price: '4' } : m));
  const d = diffMenu(base, after);
  assert(d.updated.length === 1, 'detect price change');
  console.log('  ✓ price change');
}

console.log('── edit name ──');
{
  const after = base.map((m) =>
    m.id === '1' ? { ...m, name: 'Smoked Pork Sandwich', price: '11' } : m,
  );
  assert(menuItemKey(after[0]!) === 'id:1', 'stable id key');
  assert(menuItemSiteId(after[0]!) === 'live-1', 'stable site id');
  console.log('  ✓ rename with stable id');
}

console.log('── add with image URL ──');
{
  const after: PublishedMenuItem[] = [
    ...base,
    {
      id: '99',
      name: 'Chaos Fries',
      price: '5',
      image: 'https://example.supabase.co/storage/v1/object/public/menu-images/cluckin-chaos/99.jpg',
    },
  ];
  const d = diffMenu(base, after);
  assert(d.added.includes('Chaos Fries'), 'detect add');
  assert(parseMenu(after)[3]?.image?.includes('menu-images'), 'image URL kept');
  console.log('  ✓ add with bucket image URL');
}

console.log('\nAll tests passed.');