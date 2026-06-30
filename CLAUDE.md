# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GrapheneOS Flashed Google Pixel E-commerce Store - a MERN stack application for selling privacy-fo
cused smartphones. The project emphasizes security, privacy,
and PayPal payments.

## Technology Stack

**Frontend:**
- React.js with React Hooks
- Vite (build tool)
- Tailwind CSS (styling)
- Redux with Redux Toolkit (state management)
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
- PayPal refunds available

**Inventory:**
- Just-In-Time (JIT) ordering model
- Display: "In Stock" / "Out of Stock" (no quantity counts)
- Manual order processing by admin

**Products:**
- GrapheneOS-flashed Google Pixel phones

## Accessibility & UX Requirements

- WCAG 2.1 AA compliance
- Fully responsive design (mobile-first approach)
- SEO optimized frontend
- Intuitive navigation for both customers and admins

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""