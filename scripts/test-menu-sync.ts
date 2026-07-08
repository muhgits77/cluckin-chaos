/**
 * Menu sync tests — add / edit / delete / price change.
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
  { id: '1', name: 'Pulled Pork Sandwich', price: '10' },
  { id: '2', name: 'Bourbon Nachos', price: '12' },
  { id: '3', name: 'Sweet Tea', price: '3' },
];

console.log('── parseMenu: reads column array directly ──');
{
  const parsed = parseMenu(base);
  assert(parsed.length === 3, `expected 3, got ${parsed.length}`);
  console.log('  ✓ parses menu array');
}

console.log('── delete: item removed from array ──');
{
  const after = base.filter((m) => m.id !== '2');
  const diff = diffMenu(base, after);
  assert(diff.removed.includes('Bourbon Nachos'), 'should detect removal');
  assert(parseMenu(after).length === 2, 'parsed menu should have 2 items');
  console.log('  ✓ delete detected and array shrinks');
}

console.log('── edit name: same id, new name ──');
{
  const after = base.map((m) =>
    m.id === '1' ? { ...m, name: 'Smoked Pork Sandwich' } : m,
  );
  const diff = diffMenu(base, after);
  assert(diff.updated.length === 1, 'should detect update');
  assert(menuItemKey(after[0]!) === 'id:1', 'key stable by id');
  assert(menuItemSiteId(after[0]!) === 'live-1', 'site id stable');
  console.log('  ✓ rename tracked, id key unchanged');
}

console.log('── price change ──');
{
  const after = base.map((m) => (m.id === '3' ? { ...m, price: '4' } : m));
  const diff = diffMenu(base, after);
  assert(diff.updated.some((u) => u.includes('Sweet Tea')), 'should detect price change');
  console.log('  ✓ price change detected');
}

console.log('── add: new item ──');
{
  const after: PublishedMenuItem[] = [
    ...base,
    { id: 'uuid-99', name: 'Chaos Fries', price: '5', description: 'Crispy' },
  ];
  const diff = diffMenu(base, after);
  assert(diff.added.includes('Chaos Fries'), 'should detect add');
  const parsed = parseMenu(after);
  assert(parsed[3]?.description === 'Crispy', 'description preserved');
  console.log('  ✓ add detected, description preserved');
}

console.log('── dedupe: same id twice keeps first ──');
{
  const dup = [
    { id: '1', name: 'A', price: '1' },
    { id: '1', name: 'B', price: '2' },
  ];
  const parsed = parseMenu(dup);
  assert(parsed.length === 1, 'duplicate id should dedupe');
  console.log('  ✓ duplicate id deduped');
}

console.log('── name fallback key when no id ──');
{
  const item: PublishedMenuItem = { id: '', name: 'Sweet Tea', price: '3' };
  assert(menuItemKey(item) === 'name:sweet tea', `got ${menuItemKey(item)}`);
  assert(menuItemSiteId(item) === 'live-name-sweet-tea', `got ${menuItemSiteId(item)}`);
  console.log('  ✓ name fallback key works');
}

console.log('\nAll tests passed.');