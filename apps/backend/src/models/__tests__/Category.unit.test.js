import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Category from '../Category.js';
// Importing Product registers it with mongoose so getProductCount can reach it.
import '../Product.js';

// Helper: valid category payload
const validCategory = (over = {}) => ({
  name: 'Phones',
  slug: 'phones',
  description: 'Privacy-first phones',
  ...over
});

describe('Category Model', () => {
  beforeAll(async () => {
    // Ensure the unique index on `slug` is built in the in-memory DB so the
    // unique-constraint test actually fires at the DB layer.
    await Category.syncIndexes();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  afterEach(async () => {
    await Category.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('creates a valid category with required fields', async () => {
      const doc = await new Category(validCategory()).save();

      expect(doc._id).toBeDefined();
      expect(doc.name).toBe('Phones');
      expect(doc.slug).toBe('phones');
      expect(doc.description).toBe('Privacy-first phones');
      expect(doc.parentId).toBeNull();
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });

    it('requires name', async () => {
      await expect(new Category(validCategory({ name: undefined })).save()).rejects.toThrow();
    });

    it('requires slug', async () => {
      await expect(new Category(validCategory({ slug: undefined })).save()).rejects.toThrow();
    });

    it('defaults parentId to null', async () => {
      const doc = await new Category(validCategory()).save();
      expect(doc.parentId).toBeNull();
    });

    it('trims name, slug, and description', async () => {
      const doc = await new Category(validCategory({
        name: '  Phones  ',
        slug: '  phones  ',
        description: '  desc  '
      })).save();
      expect(doc.name).toBe('Phones');
      expect(doc.slug).toBe('phones');
      expect(doc.description).toBe('desc');
    });

    it('lowercases slug via the lowercase setter', async () => {
      const doc = await new Category(validCategory({ slug: 'PHONES' })).save();
      expect(doc.slug).toBe('phones');
    });

    it('enforces a unique slug', async () => {
      await new Category(validCategory()).save();
      await expect(new Category(validCategory()).save()).rejects.toThrow();
    });

    it('rejects a name longer than 100 chars', async () => {
      await expect(new Category(validCategory({ name: 'x'.repeat(101) })).save()).rejects.toThrow();
    });

    it('rejects a slug longer than 100 chars', async () => {
      await expect(new Category(validCategory({ slug: 'x'.repeat(101) })).save()).rejects.toThrow();
    });

    it('rejects a description longer than 500 chars', async () => {
      await expect(new Category(validCategory({ description: 'x'.repeat(501) })).save()).rejects.toThrow();
    });
  });

  describe('Instance methods', () => {
    it('getUrl returns the SEO-friendly category URL', async () => {
      const doc = await new Category(validCategory()).save();
      expect(doc.getUrl()).toBe('/categories/phones');
    });
  });

  describe('Static: generateSlug', () => {
    it('lowercases and slugifies a name', async () => {
      const slug = await Category.generateSlug('Smart Phones & Tablets!');
      expect(slug).toBe('smart-phones-tablets');
    });

    it('collapses multiple spaces and hyphens into a single hyphen', async () => {
      const slug = await Category.generateSlug('Foo   Bar---Baz');
      expect(slug).toBe('foo-bar-baz');
    });

    it('strips leading and trailing hyphens', async () => {
      const slug = await Category.generateSlug('---hello---');
      expect(slug).toBe('hello');
    });

    it('appends a counter when the slug already exists', async () => {
      await new Category(validCategory({ slug: 'phones' })).save();
      const slug = await Category.generateSlug('Phones');
      expect(slug).toBe('phones-1');
    });

    it('keeps incrementing the counter until a free slug is found', async () => {
      await new Category(validCategory({ slug: 'phones' })).save();
      await new Category(validCategory({ slug: 'phones-1' })).save();
      await new Category(validCategory({ slug: 'phones-2' })).save();
      const slug = await Category.generateSlug('Phones');
      expect(slug).toBe('phones-3');
    });

    it('excludes the given excludeId so a category can keep its own slug', async () => {
      const existing = await new Category(validCategory({ slug: 'phones' })).save();
      const slug = await Category.generateSlug('Phones', existing._id);
      expect(slug).toBe('phones');
    });
  });

  describe('Static: checkCircularDependency', () => {
    it('returns true when categoryId equals parentId', async () => {
      const cat = await new Category(validCategory()).save();
      const result = await Category.checkCircularDependency(cat._id, cat._id.toString());
      expect(result).toBe(true);
    });

    // NOTE: when parentId is null the production short-circuit
    //   `!parentId || categoryId.toString() === parentId.toString()`
    // evaluates the right-hand side of `||` (because !null is true) and calls
    // `null.toString()`, throwing. We assert that real behaviour here rather
    // than a wished-for false; see Category.js checkCircularDependency.
    it('throws when parentId is null (documents current behaviour)', async () => {
      const cat = await new Category(validCategory()).save();
      await expect(Category.checkCircularDependency(cat._id, null)).rejects.toThrow();
    });

    it('returns false when parentId is a leaf with no further parent', async () => {
      const parent = await new Category(validCategory({ slug: 'parent' })).save();
      const child = await new Category(validCategory({ slug: 'child', parentId: parent._id })).save();
      const result = await Category.checkCircularDependency(child._id, parent._id);
      expect(result).toBe(false);
    });

    it('returns true when the parentId chain leads back to categoryId', async () => {
      const a = await new Category(validCategory({ slug: 'a' })).save();
      const b = await new Category(validCategory({ slug: 'b', parentId: a._id })).save();
      // Re-point A at B, creating a cycle A -> B -> A.
      a.parentId = b._id;
      await a.save();

      const result = await Category.checkCircularDependency(a._id, b._id);
      expect(result).toBe(true);
    });

    it('detects a pre-existing cycle via the visited-set guard', async () => {
      const a = await new Category(validCategory({ slug: 'aa' })).save();
      const b = await new Category(validCategory({ slug: 'bb', parentId: a._id })).save();
      const c = await new Category(validCategory({ slug: 'cc', parentId: b._id })).save();
      // Close a cycle: A -> C -> B -> A
      a.parentId = c._id;
      await a.save();

      // Start from an external id that is not part of the chain; the walk
      // enters the existing cycle and the visited guard returns true.
      const external = new mongoose.Types.ObjectId();
      const result = await Category.checkCircularDependency(external, c._id);
      expect(result).toBe(true);
    });

    it('stops walking when a parent reference cannot be found', async () => {
      const parent = await new Category(validCategory({ slug: 'ghost-parent' })).save();
      const child = await new Category(validCategory({ slug: 'ghost-child', parentId: parent._id })).save();
      // parent.parentId is null, so the walk terminates without hitting child.
      const result = await Category.checkCircularDependency(child._id, parent._id);
      expect(result).toBe(false);
    });
  });

  describe('Static: getChildren', () => {
    it('returns child categories sorted by name', async () => {
      const parent = await new Category(validCategory({ slug: 'parent' })).save();
      await new Category(validCategory({ name: 'Zeta', slug: 'zeta', parentId: parent._id })).save();
      await new Category(validCategory({ name: 'Alpha', slug: 'alpha', parentId: parent._id })).save();

      const children = await Category.getChildren(parent._id);
      expect(children).toHaveLength(2);
      expect(children[0].name).toBe('Alpha');
      expect(children[1].name).toBe('Zeta');
    });

    it('returns an empty array when the parent has no children', async () => {
      const parent = await new Category(validCategory({ slug: 'lonely' })).save();
      const children = await Category.getChildren(parent._id);
      expect(children).toHaveLength(0);
    });
  });

  describe('Static: getProductCount', () => {
    it('returns 0 when the Product model has no matching products', async () => {
      const cat = await new Category(validCategory()).save();
      const count = await Category.getProductCount(cat._id);
      expect(count).toBe(0);
    });

    it('counts products referencing the category', async () => {
      const cat = await new Category(validCategory()).save();
      const Product = mongoose.model('Product');
      await Product.deleteMany({});
      await Product.create([
        { name: 'P1', slug: 'p1', sku: 'SKU1', price: 10, baseModel: 'Pixel', category: cat._id, variations: [{ sku: 'V1', condition: 'new', price: 10, stockQuantity: 1 }] },
        { name: 'P2', slug: 'p2', sku: 'SKU2', price: 20, baseModel: 'Pixel', category: cat._id, variations: [{ sku: 'V2', condition: 'new', price: 20, stockQuantity: 1 }] }
      ]);

      const count = await Category.getProductCount(cat._id);
      expect(count).toBe(2);

      await Product.deleteMany({});
    });
  });
});
