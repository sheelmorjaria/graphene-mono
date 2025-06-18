import { test, expect } from './fixtures/test-fixtures.js';
import { AdminTestHelpers, testUtils } from './utils/test-helpers.js';

test.describe('User Management E2E Tests', () => {
  let adminHelpers;

  test.beforeEach(async ({ page, mockData }) => {
    // Initialize admin test helpers
    adminHelpers = new AdminTestHelpers(page);
    
    // Clear mock data before each test
    mockData.clearAll();
    
    // Set up realistic viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Admin Authentication', () => {
    test('should allow admin login with valid credentials', async ({ 
      page, 
      testData 
    }) => {
      // Navigate to admin login
      await page.goto('/admin/login');
      await page.waitForLoadState('networkidle');
      
      // Verify login form is displayed
      await expect(page.locator('[data-testid="admin-login-form"]')).toBeVisible();
      
      // Fill credentials
      await page.fill('[data-testid="email-input"]', testData.adminUser.email);
      await page.fill('[data-testid="password-input"]', testData.adminUser.password);
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Verify successful login
      await page.waitForURL('/admin', { timeout: 10000 });
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-user-info"]')).toContainText(testData.adminUser.email);
      
      // Take screenshot of admin dashboard
      await testUtils.takeScreenshot(page, 'admin-dashboard');
    });

    test('should reject invalid admin credentials', async ({ 
      page 
    }) => {
      await page.goto('/admin/login');
      
      // Try invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Verify error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid email or password');
      
      // Verify still on login page
      await expect(page.locator('[data-testid="admin-login-form"]')).toBeVisible();
    });

    test('should handle admin logout correctly', async ({ 
      page, 
      testData 
    }) => {
      // Login as admin
      await adminHelpers.loginAsAdmin(testData.adminUser);
      
      // Verify admin dashboard is accessible
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Logout
      await page.click('[data-testid="admin-logout"]');
      
      // Verify redirect to login page
      await page.waitForURL('/admin/login', { timeout: 5000 });
      await expect(page.locator('[data-testid="admin-login-form"]')).toBeVisible();
      
      // Verify cannot access admin pages after logout
      await page.goto('/admin/users');
      await page.waitForURL('/admin/login', { timeout: 5000 });
    });
  });

  test.describe('User Management Interface', () => {
    test('should display user management dashboard', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      // Create test users
      const testUsers = [
        {
          _id: 'user-1',
          email: 'customer1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'user-2',
          email: 'customer2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'customer',
          isActive: false,
          createdAt: new Date().toISOString()
        }
      ];

      testUsers.forEach(user => mockData.addUser(user));
      
      // Login as admin
      await adminHelpers.loginAsAdmin(testData.adminUser);
      
      // Navigate to user management
      await adminHelpers.navigateToUserManagement();
      
      // Verify user management interface
      await expect(page.locator('[data-testid="user-management-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-filters"]')).toBeVisible();
      
      // Verify users are displayed
      await adminHelpers.verifyUserInList({
        id: 'user-1',
        email: 'customer1@example.com',
        status: 'active'
      });
      
      await adminHelpers.verifyUserInList({
        id: 'user-2',
        email: 'customer2@example.com',
        status: 'inactive'
      });
      
      // Take screenshot of user management
      await testUtils.takeScreenshot(page, 'user-management-dashboard');
    });

    test('should allow user search functionality', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      // Create multiple test users
      const testUsers = [
        { _id: 'user-1', email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
        { _id: 'user-2', email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
        { _id: 'user-3', email: 'bob.wilson@example.com', firstName: 'Bob', lastName: 'Wilson' }
      ];
      
      testUsers.forEach(user => mockData.addUser({
        ...user,
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      }));
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Test search by email
      await adminHelpers.searchUsers('john.doe@example.com');
      await expect(page.locator('[data-testid="user-row-user-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-user-2"]')).not.toBeVisible();
      
      // Clear search and test search by name
      await page.fill('[data-testid="user-search"]', '');
      await adminHelpers.searchUsers('Jane');
      await expect(page.locator('[data-testid="user-row-user-2"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-user-1"]')).not.toBeVisible();
      
      // Clear search to show all users
      await page.fill('[data-testid="user-search"]', '');
      await page.press('[data-testid="user-search"]', 'Enter');
      await expect(page.locator('[data-testid="user-row-user-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-user-2"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-user-3"]')).toBeVisible();
    });

    test('should allow filtering users by status', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create users with different statuses
      const activeUser = {
        _id: 'active-user',
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      const inactiveUser = {
        _id: 'inactive-user',
        email: 'inactive@example.com',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'customer',
        isActive: false,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(activeUser);
      mockData.addUser(inactiveUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Filter by active users
      await page.selectOption('[data-testid="status-filter"]', 'active');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('[data-testid="user-row-active-user"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-inactive-user"]')).not.toBeVisible();
      
      // Filter by inactive users
      await page.selectOption('[data-testid="status-filter"]', 'inactive');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('[data-testid="user-row-inactive-user"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-active-user"]')).not.toBeVisible();
      
      // Show all users
      await page.selectOption('[data-testid="status-filter"]', 'all');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('[data-testid="user-row-active-user"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row-inactive-user"]')).toBeVisible();
    });
  });

  test.describe('User Status Management', () => {
    test('should allow updating user status from active to inactive', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      // Create active user
      const testUser = {
        _id: 'test-user-123',
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(testUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Verify user is initially active
      await adminHelpers.verifyUserInList({
        id: 'test-user-123',
        email: 'testuser@example.com',
        status: 'active'
      });
      
      // Update user status to inactive
      await adminHelpers.updateUserStatus('test-user-123', 'inactive');
      
      // Wait for API response
      await testUtils.waitForApiResponse(page, '/api/admin/users/test-user-123/status');
      
      // Verify status update success message
      await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
      
      // Verify user status is updated in the UI
      await adminHelpers.verifyUserInList({
        id: 'test-user-123',
        email: 'testuser@example.com',
        status: 'inactive'
      });
      
      // Take screenshot of status update
      await testUtils.takeScreenshot(page, 'user-status-updated');
    });

    test('should allow reactivating inactive users', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create inactive user
      const inactiveUser = {
        _id: 'inactive-user-456',
        email: 'inactive@example.com',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'customer',
        isActive: false,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(inactiveUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Verify user is initially inactive
      await adminHelpers.verifyUserInList({
        id: 'inactive-user-456',
        email: 'inactive@example.com',
        status: 'inactive'
      });
      
      // Reactivate user
      await adminHelpers.updateUserStatus('inactive-user-456', 'active');
      
      // Verify reactivation
      await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
      await adminHelpers.verifyUserInList({
        id: 'inactive-user-456',
        email: 'inactive@example.com',
        status: 'active'
      });
    });

    test('should handle bulk user status updates', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create multiple users
      const users = [
        { _id: 'bulk-1', email: 'bulk1@example.com', firstName: 'Bulk', lastName: 'User1' },
        { _id: 'bulk-2', email: 'bulk2@example.com', firstName: 'Bulk', lastName: 'User2' },
        { _id: 'bulk-3', email: 'bulk3@example.com', firstName: 'Bulk', lastName: 'User3' }
      ];
      
      users.forEach(user => mockData.addUser({
        ...user,
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      }));
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Select multiple users
      await page.check('[data-testid="select-user-bulk-1"]');
      await page.check('[data-testid="select-user-bulk-2"]');
      await page.check('[data-testid="select-user-bulk-3"]');
      
      // Perform bulk status update
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-deactivate"]');
      
      // Confirm bulk action
      await page.click('[data-testid="confirm-bulk-action"]');
      
      // Wait for bulk update completion
      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible();
      
      // Verify all selected users are deactivated
      for (const user of users) {
        await adminHelpers.verifyUserInList({
          id: user._id,
          email: user.email,
          status: 'inactive'
        });
      }
    });
  });

  test.describe('User Details and Audit', () => {
    test('should display detailed user information', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create detailed user
      const detailedUser = {
        _id: 'detailed-user',
        email: 'detailed@example.com',
        firstName: 'Detailed',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString(),
        lastLogin: new Date('2024-12-18').toISOString(),
        orderCount: 5,
        totalSpent: 2499.95,
        addresses: [
          {
            type: 'shipping',
            fullName: 'Detailed User',
            addressLine1: '123 Main St',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          }
        ]
      };
      
      mockData.addUser(detailedUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Click on user to view details
      await page.click('[data-testid="view-user-detailed-user"]');
      
      // Verify user details modal/page
      await expect(page.locator('[data-testid="user-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-email"]')).toContainText('detailed@example.com');
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Detailed User');
      await expect(page.locator('[data-testid="user-role"]')).toContainText('customer');
      await expect(page.locator('[data-testid="user-created"]')).toContainText('2024-01-15');
      await expect(page.locator('[data-testid="user-last-login"]')).toContainText('2024-12-18');
      await expect(page.locator('[data-testid="user-order-count"]')).toContainText('5');
      await expect(page.locator('[data-testid="user-total-spent"]')).toContainText('£2,499.95');
      
      // Verify addresses section
      await expect(page.locator('[data-testid="user-addresses"]')).toBeVisible();
      await expect(page.locator('[data-testid="address-0"]')).toContainText('123 Main St');
      
      // Take screenshot of user details
      await testUtils.takeScreenshot(page, 'user-details-view');
    });

    test('should display user activity audit trail', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create user with activity history
      const auditUser = {
        _id: 'audit-user',
        email: 'audit@example.com',
        firstName: 'Audit',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString(),
        activityLog: [
          {
            action: 'status_changed',
            from: 'active',
            to: 'inactive',
            adminId: 'admin-user-id',
            adminEmail: 'admin@graphene-store.com',
            timestamp: new Date('2024-12-17').toISOString(),
            reason: 'Suspicious activity reported'
          },
          {
            action: 'status_changed',
            from: 'inactive',
            to: 'active',
            adminId: 'admin-user-id',
            adminEmail: 'admin@graphene-store.com',
            timestamp: new Date('2024-12-18').toISOString(),
            reason: 'Issue resolved, account reactivated'
          }
        ]
      };
      
      mockData.addUser(auditUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // View user details
      await page.click('[data-testid="view-user-audit-user"]');
      
      // Navigate to audit trail tab
      await page.click('[data-testid="audit-trail-tab"]');
      
      // Verify audit trail entries
      await expect(page.locator('[data-testid="audit-trail"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('status_changed');
      await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('active → inactive');
      await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('admin@graphene-store.com');
      await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('Suspicious activity reported');
      
      await expect(page.locator('[data-testid="audit-entry-1"]')).toContainText('inactive → active');
      await expect(page.locator('[data-testid="audit-entry-1"]')).toContainText('Issue resolved');
    });
  });

  test.describe('Security and Access Control', () => {
    test('should prevent non-admin access to user management', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Try to access user management without authentication
      await page.goto('/admin/users');
      
      // Should redirect to login
      await page.waitForURL('/admin/login', { timeout: 5000 });
      await expect(page.locator('[data-testid="admin-login-form"]')).toBeVisible();
      
      // Login as customer (non-admin)
      const customerAuth = await api.loginAsCustomer();
      
      // Try to access admin area with customer token
      await page.goto('/admin/users', {
        extraHTTPHeaders: customerAuth.headers
      });
      
      // Should still redirect to login or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('should log admin actions for security audit', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create user to modify
      const testUser = {
        _id: 'security-test-user',
        email: 'security@example.com',
        firstName: 'Security',
        lastName: 'Test',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(testUser);
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Perform admin action
      await adminHelpers.updateUserStatus('security-test-user', 'inactive');
      
      // Verify security audit log (this would typically be checked in backend logs)
      await expect(page.locator('[data-testid="admin-action-logged"]')).toBeVisible();
      
      // Check system audit trail
      await page.goto('/admin/audit');
      await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-actions"]')).toContainText('User status updated');
      await expect(page.locator('[data-testid="recent-actions"]')).toContainText('security@example.com');
      await expect(page.locator('[data-testid="recent-actions"]')).toContainText(testData.adminUser.email);
    });
  });

  test.describe('Performance and Pagination', () => {
    test('should handle large user datasets with pagination', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Create large dataset of users
      const users = [];
      for (let i = 1; i <= 50; i++) {
        users.push({
          _id: `user-${i}`,
          email: `user${i}@example.com`,
          firstName: `User`,
          lastName: `${i}`,
          role: 'customer',
          isActive: i % 2 === 0, // Alternate active/inactive
          createdAt: new Date().toISOString()
        });
      }
      
      users.forEach(user => mockData.addUser(user));
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Verify pagination controls
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-info"]')).toContainText('1 of');
      
      // Test page navigation
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('[data-testid="page-info"]')).toContainText('2 of');
      
      // Test page size selector
      await page.selectOption('[data-testid="page-size"]', '25');
      await page.waitForLoadState('networkidle');
      
      // Verify more users are displayed
      const userRows = await page.locator('[data-testid^="user-row-"]').count();
      expect(userRows).toBe(25);
      
      // Test direct page navigation
      await page.fill('[data-testid="page-number-input"]', '2');
      await page.press('[data-testid="page-number-input"]', 'Enter');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('[data-testid="page-info"]')).toContainText('2 of');
    });

    test('should maintain good performance with real-time updates', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Measure initial page load time
      const startTime = await testUtils.measurePageLoadTime(page, '/admin/users');
      expect(startTime).toBeLessThan(3000); // Should load within 3 seconds
      
      await adminHelpers.loginAsAdmin(testData.adminUser);
      await adminHelpers.navigateToUserManagement();
      
      // Create user for testing
      const testUser = {
        _id: 'perf-test-user',
        email: 'perf@example.com',
        firstName: 'Performance',
        lastName: 'Test',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(testUser);
      
      // Measure status update performance
      const updateStartTime = Date.now();
      await adminHelpers.updateUserStatus('perf-test-user', 'inactive');
      const updateEndTime = Date.now();
      
      expect(updateEndTime - updateStartTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Verify UI responsiveness
      await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
    });
  });

  test.describe('Mobile Admin Experience', () => {
    test('should work correctly on mobile devices', async ({ 
      page, 
      testData, 
      mockData 
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Create test user
      const mobileUser = {
        _id: 'mobile-user',
        email: 'mobile@example.com',
        firstName: 'Mobile',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockData.addUser(mobileUser);
      
      // Login on mobile
      await adminHelpers.loginAsAdmin(testData.adminUser);
      
      // Navigate to user management
      await page.click('[data-testid="mobile-menu-toggle"]');
      await page.click('[data-testid="nav-user-management"]');
      
      // Verify mobile-responsive layout
      await expect(page.locator('[data-testid="mobile-user-list"]')).toBeVisible();
      
      // Test mobile user status update
      await page.click('[data-testid="mobile-user-mobile-user"]');
      await page.click('[data-testid="mobile-status-toggle"]');
      
      // Verify mobile status update
      await expect(page.locator('[data-testid="mobile-status-updated"]')).toBeVisible();
      
      // Take mobile screenshot
      await testUtils.takeScreenshot(page, 'mobile-user-management');
    });
  });
});