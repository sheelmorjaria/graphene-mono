// Parser regression tests for syncFromCLI.js — run with:
//   node --test syncFromCLI.parser.test.js
//
// Guards extractModelInfo against the numbered Pro Fold gap (prod incident
// 2026-09-15: "Pixel 10 Pro Fold" quotes were parsed as baseModel "Pixel 10
// Pro" with the fold name folded into the color, so fold variations were
// never repriced AND fold prices risked contaminating the non-fold 10 Pro /
// 9 Pro products).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractModelInfo, findVariationImage } from './syncFromCLI.js';

test('image matcher: model+color concat matches known naming conventions', () => {
  const files = [
    '10profoldmoonstone.jpg',
    '6Prostormyblack.webp',
    'pixelfoldobsidian.webp',
    '10aberry.webp',
    '9proxlrosequartz.webp',
    '9aobsidian.webp'
  ];
  // numbered fold, lowercase color
  assert.equal(findVariationImage('10 Pro Fold', 'Moonstone', files), '/images/products/10profoldmoonstone.jpg');
  // case-insensitive against mixed-case filenames
  assert.equal(findVariationImage('6 Pro', 'Stormy Black', files), '/images/products/6Prostormyblack.webp');
  // multi-word color collapses
  assert.equal(findVariationImage('9 Pro XL', 'Rose Quartz', files), '/images/products/9proxlrosequartz.webp');
  // a-series model
  assert.equal(findVariationImage('10a', 'Berry', files), '/images/products/10aberry.webp');
  assert.equal(findVariationImage('9A', 'Obsidian', files), '/images/products/9aobsidian.webp');
  // original Fold files carry a "pixel" prefix ("pixelfoldobsidian")
  assert.equal(findVariationImage('Fold', 'Obsidian', files), '/images/products/pixelfoldobsidian.webp');
});

test('image matcher: no match returns null, never a placeholder', () => {
  const files = ['10obsidian.jpg'];
  assert.equal(findVariationImage('10a', 'Berry', files), null);
  assert.equal(findVariationImage('10a', '', files), null);
  assert.equal(findVariationImage('', 'Obsidian', files), null);
});

test('numbered Pro Fold: storage + color extracted, own base model', () => {
  assert.deepEqual(
    extractModelInfo('Google Pixel 10 Pro Fold 256GB Moonstone, Unlocked C [Android Phones]'),
    { modelName: 'Pixel 10 Pro Fold', storage: '256GB', color: 'Moonstone' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 10 Pro Fold 512GB Jade, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 10 Pro Fold', storage: '512GB', color: 'Jade' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 10 Pro Fold 1TB Moonstone, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 10 Pro Fold', storage: '1TB', color: 'Moonstone' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 9 Pro Fold 256GB Obsidian, Unlocked C [Android Phones]'),
    { modelName: 'Pixel 9 Pro Fold', storage: '256GB', color: 'Obsidian' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 9 Pro Fold 512GB Porcelain, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 9 Pro Fold', storage: '512GB', color: 'Porcelain' }
  );
});

test('numbered Pro Fold: defaults when storage is missing from the name', () => {
  assert.deepEqual(
    extractModelInfo('Google Pixel 9 Pro Fold Obsidian, Unlocked C [Android Phones]'),
    { modelName: 'Pixel 9 Pro Fold', storage: '256GB', color: 'Obsidian' }
  );
});

test('numbered Pro Fold: storage embedded in the color field still splits', () => {
  assert.deepEqual(
    extractModelInfo('Google Pixel 10 Pro Fold Moonstone 512GB, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 10 Pro Fold', storage: '512GB', color: 'Moonstone' }
  );
});

test('original Pixel Fold branch still works (no model number)', () => {
  assert.deepEqual(
    extractModelInfo('Google Pixel Fold 256GB Obsidian, Unlocked C [Android Phones]'),
    { modelName: 'Pixel Fold', storage: '256GB', color: 'Obsidian' }
  );
});

test('regression: non-fold models are unchanged', () => {
  assert.deepEqual(
    extractModelInfo('Google Pixel 9 Pro XL 16GB+256GB Obsidian, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 9 Pro XL', storage: '256GB', color: 'Obsidian' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 10 Pro 128GB Obsidian, Unlocked B [Android Phones]'),
    { modelName: 'Pixel 10 Pro', storage: '128GB', color: 'Obsidian' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 9a 256GB Obsidian, Unlocked C [Android Phones]'),
    { modelName: 'Pixel 9a', storage: '256GB', color: 'Obsidian' }
  );
  assert.deepEqual(
    extractModelInfo('Google Pixel 8 128GB Rose, Unlocked A [Android Phones]'),
    { modelName: 'Pixel 8', storage: '128GB', color: 'Rose' }
  );
});
