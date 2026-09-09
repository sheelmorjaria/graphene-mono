import { describe, it, expect } from 'vitest';
import { groupProductsBySeries } from '../productSections.js';

// Series sections give the catalog page semantic structure (H2 per series +
// anchor TOC) that both users and search engines parse as site organisation.

const p = (name, slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) => ({ name, slug });

describe('groupProductsBySeries', () => {
  it('groups products into descending Pixel series', () => {
    const groups = groupProductsBySeries([
      p('GrapheneOS Pixel 7A'), p('GrapheneOS Pixel 10 Pro'), p('GrapheneOS Pixel 9')
    ]);

    expect(groups.map((g) => g.label)).toEqual(['Pixel 10 Series', 'Pixel 9 Series', 'Pixel 7 Series']);
    expect(groups[0].products).toHaveLength(1);
    expect(groups[0].key).toBe('pixel-10');
  });

  it('separates Folds into their own section, newest first', () => {
    const groups = groupProductsBySeries([
      p('GrapheneOS Pixel Fold'), p('GrapheneOS Pixel 9 Pro Fold'), p('GrapheneOS Pixel 10')
    ]);

    expect(groups.map((g) => g.label)).toEqual(['Pixel 10 Series', 'Pixel Folds']);
    expect(groups[1].products.map((x) => x.name)).toEqual([
      'GrapheneOS Pixel Fold', 'GrapheneOS Pixel 9 Pro Fold'
    ]);
  });

  it('buckets unparseable names into Other Devices (last)', () => {
    const groups = groupProductsBySeries([p('Mystery Device'), p('GrapheneOS Pixel 8')]);
    expect(groups.map((g) => g.label)).toEqual(['Pixel 8 Series', 'Other Devices']);
  });

  it('returns an empty array for no products', () => {
    expect(groupProductsBySeries([])).toEqual([]);
  });

  it('keeps within-group order stable', () => {
    const groups = groupProductsBySeries([
      p('GrapheneOS Pixel 9 Pro'), p('GrapheneOS Pixel 9a'), p('GrapheneOS Pixel 9')
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].products.map((x) => x.name)).toEqual([
      'GrapheneOS Pixel 9 Pro', 'GrapheneOS Pixel 9a', 'GrapheneOS Pixel 9'
    ]);
  });
});
