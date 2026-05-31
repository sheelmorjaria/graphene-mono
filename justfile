# Graphene Security Monorepo - Justfile
# A command runner for development, testing, and deployment

# Default recipe - list available commands
default:
    @just --list

# =============================================================================
# DEVELOPMENT
# =============================================================================

# Start both frontend and backend in development mode
dev:
    concurrently "npm run dev:backend" "npm run dev:frontend"

# Start backend only (with nodemon hot-reload)
dev-backend:
    @cd apps/backend && npm run dev

# Start frontend only (with Vite hot-reload)
dev-frontend:
    @cd apps/frontend && npm run dev

# =============================================================================
# BUILD
# =============================================================================

# Build all workspaces
build:
    npm run build

# Build frontend only
build-frontend:
    @cd apps/frontend && npm run build

# Backend has no build step (placeholder for consistency)
build-backend:
    @echo "Backend: No build step required for Node.js"

# =============================================================================
# TESTING - ALL
# =============================================================================

# Run all tests (unit + integration + e2e)
test:
    @cd apps/backend && npm run test:all
    @cd apps/frontend && npm run test:run

# Run all tests in CI mode (unit + integration only, faster)
test-ci:
    @cd apps/backend && npm run test:ci
    @cd apps/frontend && npm run test:run

# Run all tests with coverage
test-coverage:
    @cd apps/backend && npm run test:coverage:all
    @cd apps/frontend && npm run test:coverage

# =============================================================================
# TESTING - BACKEND UNIT
# =============================================================================

# Run backend unit tests
test-unit:
    @cd apps/backend && npm run test:unit

# Run backend unit tests in watch mode
test-unit-watch:
    @cd apps/backend && npm run test:unit:watch

# Run backend unit tests with UI
test-unit-ui:
    @cd apps/backend && npm run test:ui

# =============================================================================
# TESTING - BACKEND INTEGRATION
# =============================================================================

# Run backend integration tests
test-integration:
    @cd apps/backend && npm run test:integration

# Run backend integration tests in watch mode
test-integration-watch:
    @cd apps/backend && npm run test:integration:watch

# Run backend integration tests with coverage
test-integration-coverage:
    @cd apps/backend && npm run test:coverage:integration

# =============================================================================
# TESTING - BACKEND E2E
# =============================================================================

# Run backend e2e tests
test-e2e:
    @cd apps/backend && npm run test:e2e

# Run backend e2e tests in watch mode
test-e2e-watch:
    @cd apps/backend && npm run test:e2e:watch

# =============================================================================
# TESTING - BACKEND SPECIALIZED
# =============================================================================

# Run backend model tests
test-models:
    @cd apps/backend && npm run test:models

# Run backend performance tests
test-performance:
    @cd apps/backend && npm run test:performance

# Run backend security tests
test-security:
    @cd apps/backend && npm run test:security

# =============================================================================
# TESTING - FRONTEND
# =============================================================================

# Run frontend unit tests (excludes integration)
test-frontend-unit:
    @cd apps/frontend && npm run test:unit

# Run frontend integration tests
test-frontend-integration:
    @cd apps/frontend && npm run test:integration

# Run frontend tests in watch mode
test-frontend-watch:
    @cd apps/frontend && npm run test:watch

# Run frontend tests with UI
test-frontend-ui:
    @cd apps/frontend && npm run test:ui

# Run frontend tests with coverage
test-frontend-coverage:
    @cd apps/frontend && npm run test:coverage

# =============================================================================
# TESTING - PLAYWRIGHT (E2E UI)
# =============================================================================

# Run Playwright tests (headless)
test-playwright:
    @cd apps/backend && npm run test:playwright

# Run Playwright tests in headed mode (see browser)
test-playwright-headed:
    @cd apps/backend && npm run test:playwright:headed

# Run Playwright tests with debug mode
test-playwright-debug:
    @cd apps/backend && npm run test:playwright:debug

# Run Playwright tests with UI mode
test-playwright-ui:
    @cd apps/backend && npm run test:playwright:ui

# Show Playwright test report
test-playwright-report:
    @cd apps/backend && npm run test:playwright:report

# Install Playwright browsers
playwright-install:
    @cd apps/backend && npm run test:playwright:install

# Run Playwright payment flow tests only
test-playwright-payments:
    @cd apps/backend && npm run test:playwright:payments

# Run Playwright user management tests only
test-playwright-users:
    @cd apps/backend && npm run test:playwright:users

# =============================================================================
# LINTING & FORMATTING
# =============================================================================

# Lint all workspaces
lint:
    npm run lint

# Lint and fix all issues
lint-fix:
    npm run lint:fix

# Lint backend only
lint-backend:
    @cd apps/backend && npm run lint

# Lint and fix backend only
lint-backend-fix:
    @cd apps/backend && npm run lint:fix

# Lint frontend only
lint-frontend:
    @cd apps/frontend && npm run lint

# Lint and fix frontend only
lint-frontend-fix:
    @cd apps/frontend && npm run lint:fix

# =============================================================================
# TYPE CHECKING
# =============================================================================

# Type check all workspaces (placeholder - JS project)
type-check:
    npm run type-check

# =============================================================================
# CLEANING
# =============================================================================

# Clean all build artifacts and node_modules
clean:
    npm run clean

# Clean dependencies only (keeps build artifacts)
clean-deps:
    npm run clean:deps

# Fresh install - remove all dependencies and reinstall
fresh-install:
    npm run fresh-install

# Clean backend artifacts
clean-backend:
    @cd apps/backend && npm run clean

# Clean frontend artifacts
clean-frontend:
    @cd apps/frontend && npm run clean

# =============================================================================
# DATABASE
# =============================================================================

# Seed database with initial data
db-seed:
    @cd apps/backend && npm run seed

# Create an admin user
db-create-admin:
    @cd apps/backend && npm run create-admin

# =============================================================================
# SERVICES & UTILITIES
# =============================================================================

# Start backend production server
start:
    npm run start

# Test email service
test-email:
    @cd apps/backend && npm run test:email

# Test email service (simple version)
test-email-simple:
    @cd apps/backend && npm run test:email:simple

# Test AWS SES email service
test-ses:
    @cd apps/backend && npm run test:ses

# Validate PayPal credentials
validate-paypal:
    @cd apps/backend && npm run validate:paypal

# =============================================================================
# DOCKER
# =============================================================================

# Start development environment with Docker
docker-dev:
    docker-compose -f docker-compose.dev.yml up

# Start production environment with Docker
docker-prod:
    docker-compose -f docker-compose.yml up

# Start test environment with Docker
docker-test:
    docker-compose -f docker-compose.test.yml up

# Start Tor-enabled environment with Docker
docker-tor:
    docker-compose -f docker-compose.tor.yml up

# Stop all Docker containers
docker-down:
    docker-compose down

# =============================================================================
# CHANGESETS (VERSIONING)
# =============================================================================

# Create a changeset
changeset:
    npm run changeset

# Version packages based on changesets
changeset-version:
    npm run changeset:version

# Publish packages to npm
changeset-publish:
    npm run changeset:publish

# =============================================================================
# PREVIEW
# =============================================================================

# Preview frontend build locally
preview-frontend:
    @cd apps/frontend && npm run preview
