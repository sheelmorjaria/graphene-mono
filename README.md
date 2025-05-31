# README.md

This file provides project information

## Project Overview

This is a GrapheneOS Flashed Google Pixel E-commerce Store - a MERN stack application for selling privacy-focused smartphones with optional privacy app installation services. The project emphasizes security, privacy, and multiple payment methods including cryptocurrencies.

## Technology Stack

**Frontend:**
- React.js with React Hooks
- Vite (build tool)
- Tailwind CSS (styling)
- Redux with Redux Toolkit (state management, especially for crypto payments)
- JavaScript ES6+ syntax

**Backend:**
- Node.js with Express.js
- JavaScript ES6+ syntax with ES modules (import/export)
- Mongoose ODM for MongoDB interaction

**Database:**
- MongoDB

**Testing:**
- Frontend: Jest, React Testing Library
- Backend: Jest, Supertest
- TDD methodology strictly enforced

**Payment Integrations:**
- PayPal SDK
- Bitcoin: Blockonomics (address generation, confirmation tracking)
- Monero: GloBee (private transactions)
- Exchange rates: CoinGecko API

**Infrastructure:**
- Frontend deployment: Vercel
- Backend deployment: AWS
- CI/CD: GitHub Actions
- APM: New Relic
- Error logging: Sentry
- Logging: AWS CloudWatch Logs

## Architecture

The system follows a Client-Server architecture with clear separation:

1. **Frontend (SPA)**: Customer storefront and Admin Dashboard
2. **Backend (RESTful APIs)**: Business logic and third-party integrations
3. **Database**: MongoDB for all application data
4. **External Services**: Payment gateways, email service, cloud hosting

### Key Backend Services:
- Authentication & User Service
- Product Catalog Service
- Order & Checkout Service
- Payment & Shipping Service
- Admin Management Services
- Reporting & Analytics Service

## Development Requirements

**Mandatory Practices:**
- Test-Driven Development (TDD) for all code
- ES6+ modules syntax (import/export) throughout codebase
- ESLint compliance for code quality
- Security-first approach following OWASP Top 10
- Code reviews required

**Security Constraints:**
- No private keys stored in application
- All data encrypted in transit and at rest
- Rate limiting on all APIs
- CORS properly configured
- Privacy-focused logging (minimal PII collection)

## Business Rules

**Currency & Payments:**
- All pricing in GBP (£)
- Bitcoin payments: 2 confirmations (~30 minutes)
- Monero payments: 10 confirmations (~20 minutes)
- Fixed exchange rates with validity windows
- PayPal refunds available; crypto refunds handled manually

**Inventory:**
- Just-In-Time (JIT) ordering model
- Display: "In Stock" / "Out of Stock" (no quantity counts)
- Manual order processing by admin

**Products:**
- GrapheneOS-flashed Google Pixel phones
- Optional "Privacy App Installation" service (fixed fee)

## Accessibility & UX Requirements

- WCAG 2.1 AA compliance
- Fully responsive design (mobile-first approach)
- SEO optimized frontend
- Intuitive navigation for both customers and admins

## Key User Flows

1. **Customer Purchase**: Browse → Product Details → Add to Cart → Checkout → Payment (PayPal/Bitcoin/Monero) → Confirmation
2. **Admin Management**: Login → Dashboard → Product/Order Management → Reports

## Project Structure (Planned)

The monorepo will likely contain:
```
/frontend          # React.js application
/backend           # Express.js API server
/shared            # Shared utilities and types
/docs              # Additional documentation
/tests             # Cross-project test utilities
```
