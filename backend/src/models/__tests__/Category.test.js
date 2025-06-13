// import mongoose from 'mongoose'; // For future database-specific tests
import Category from '../Category.js';

describe('Category Model', () => {
  // Using global test setup for MongoDB connection

  afterEach(async () => {
    await Category.deleteMany({});
  });

  describe('Category Schema Validation', () => {
    it('should create a valid category with required fields', async () => {
      const categoryData = {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Privacy-focused smartphones running GrapheneOS'
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.slug).toBe(categoryData.slug);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const categoryData = {
        slug: 'test-category'
      };

      const category = new Category(categoryData);
      
      await expect(category.save()).rejects.toThrow('Category validation failed: name: Path `name` is required');
    });

    it('should require slug field', async () => {
      const categoryData = {
        name: 'Test Category'
      };

      const category = new Category(categoryData);
      
      await expect(category.save()).rejects.toThrow('Category validation failed: slug: Path `slug` is required');
    });

    it('should ensure slug is unique', async () => {
      const categoryData1 = {
        name: 'Category 1',
        slug: 'unique-slug'
      };
      
      const categoryData2 = {
        name: 'Category 2',
        slug: 'unique-slug'
      };

      await new Category(categoryData1).save();
      
      await expect(new Category(categoryData2).save()).rejects.toThrow();
    });

    it('should allow optional description field', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test-category'
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.description).toBeUndefined();
    });
  });

  describe('Category Methods', () => {
    it('should have a method to generate SEO-friendly URL', async () => {
      const categoryData = {
        name: 'Smartphones',
        slug: 'smartphones'
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.getUrl()).toBe('/categories/smartphones');
    });
  });
});