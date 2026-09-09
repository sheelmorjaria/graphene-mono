// Groups catalog products into device-series sections (Pixel 10 Series,
// Pixel Folds, ...) so the products page renders semantic H2 sections with
// anchors — site organisation that users and search engines both read.

const seriesOf = (product) => {
  const name = product.name || '';
  // Section order: numbered series newest-first, then Folds, then anything else.
  const match = /Pixel\s+(\d+)/i.exec(name);
  if (match && !/fold/i.test(name)) {
    const generation = Number(match[1]);
    return { key: `pixel-${generation}`, label: `Pixel ${generation} Series`, rank: generation };
  }
  if (/fold/i.test(name)) return { key: 'folds', label: 'Pixel Folds', rank: 0 };
  return { key: 'other', label: 'Other Devices', rank: -1 };
};

export const groupProductsBySeries = (products) => {
  const groups = new Map();
  for (const product of products || []) {
    const { key, label } = seriesOf(product);
    if (!groups.has(key)) {
      groups.set(key, { key, label, products: [] });
    }
    groups.get(key).products.push(product);
  }
  return [...groups.values()].sort((a, b) => seriesOf(b.products[0]).rank - seriesOf(a.products[0]).rank);
};
