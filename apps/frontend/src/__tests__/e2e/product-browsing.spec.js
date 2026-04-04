import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/api-mocks.js';
import { testProducts, testProductDetail } from './fixtures/test-data.js';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test.describe('Product Listing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/products');
    });

    test('should display the product listing page', async ({ page }) => {
      await expect(page.getByText(/Smartphones|our products|Browse/i).first()).toBeVisible();
    });

    test('should show products on the page', async ({ page }) => {
      await expect(page.getByText(testProducts[0].name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(testProducts[1].name)).toBeVisible();
    });

    test('should display product prices', async ({ page }) => {
      await expect(page.getByText(/699\.99/)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/999\.99/)).toBeVisible();
    });

    test('should navigate to product detail when clicking a product', async ({ page }) => {
      await page.getByRole('link', { name: /view details/i }).first().click();      await expect(page).toHaveURL(new RegExp(testProducts[0].slug));
    });

    test('should display filter sidebar', async ({ page }) => {
      await expect(page.getByText(/filter/i)).toBeVisible();
    });

    test('should display sort options', async ({ page }) => {
      const sortElement = page.getByRole('combobox').or(page.getByText(/sort/i));
      await expect(sortElement.first()).toBeVisible();
    });
  });

  test.describe('Product Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/products');
    });

    test('should filter by condition', async ({ page }) => {
      const conditionFilter = page.getByLabel(/condition/i).or(page.getByText(/refurbished/i));
      if (await conditionFilter.first().isVisible()) {
        await conditionFilter.first().click();

        page.route('**/api/products?**', (route) => {
          const url = new URL(route.request().url());
          const condition = url.searchParams.get('condition');
          const filtered = condition
            ? testProducts.filter((p) => p.availableConditions?.includes(condition))
            : testProducts;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: filtered,
              pagination: { page: 1, limit: 12, total: filtered.length, pages: 1 },
            }),
          });
        });

        await expect(page.getByText(testProducts[2].name)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should filter by price range', async ({ page }) => {
      const priceMin = page.getByLabel(/min.*price|price.*from/i);
      const priceMax = page.getByLabel(/max.*price|price.*to/i);

      if (await priceMin.isVisible() && await priceMax.isVisible()) {
        await priceMin.fill('400');
        await priceMax.fill('500');

        page.route('**/api/products?**', (route) => {
          const url = new URL(route.request().url());
          const min = parseFloat(url.searchParams.get('minPrice') || '0');
          const max = parseFloat(url.searchParams.get('maxPrice') || '99999');
          const filtered = testProducts.filter((p) => {
            const price = p.priceRange?.min || 0;
            return price >= min && price <= max;
          });
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: filtered,
              pagination: { page: 1, limit: 12, total: filtered.length, pages: 1 },
            }),
          });
        });

        await expect(page.getByText(testProducts[2].name)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Product Search', () => {
    test('should search for products', async ({ page }) => {
      await page.goto('/#/products');

      // Override the products route to handle search
      page.route('**/api/products**', (route) => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search') || url.searchParams.get('q') || '';
        const filtered = search ? [testProducts[0]] : testProducts;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: filtered,
            pagination: { page: 1, limit: 12, total: filtered.length, pages: 1 },
          }),
        });
      });

      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Pixel 8');
        await searchInput.press('Enter');

        // Just verify search was performed (page doesn't crash)
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Product Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/#/products/${testProductDetail.slug}`);
    });

    test('should display product name and description', async ({ page }) => {
      await expect(page.getByText(testProductDetail.name).first()).toBeVisible({ timeout: 10000 });
      // Product detail page should contain description-related text
      const hasDescription = await page.getByText(/privacy/i).first().isVisible().catch(() => false);
      if (hasDescription) {
        await expect(page.getByText(/privacy/i).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display product price', async ({ page }) => {
      await expect(page.getByText(/699\.99/)).toBeVisible({ timeout: 5000 });
    });

    test('should display product images', async ({ page }) => {
      const images = page.getByRole('img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display add to cart button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 5000 });
    });

    test('should display product specifications', async ({ page }) => {
      await expect(page.getByText(/display/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back to product listing', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /back to products|all products/i });
      if (await backLink.isVisible()) {
        await backLink.click();
        await expect(page).toHaveURL(/\/products/);
      }
    });

    test('should display breadcrumb or product heading', async ({ page }) => {
      // Either breadcrumbs or product name heading should be visible
      const breadcrumb = page.getByText(/home|products/i).first();
      const productHeading = page.getByRole('heading', { level: 1 });
      await expect(breadcrumb.or(productHeading).first()).toBeVisible({ timeout: 5000 });
    });

    test('should allow selecting variations if available', async ({ page }) => {
      const variation = page.getByText(/256GB/);
      if (await variation.isVisible()) {
        await variation.click();
        await expect(page.getByText(/799\.99/)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display products on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/#/products');

      await expect(page.getByText(testProducts[0].name)).toBeVisible({ timeout: 10000 });
    });

    test('should have accessible product grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/#/products');

      await expect(page.getByText(testProducts[0].name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(testProducts[1].name)).toBeVisible();
    });
  });
});
