# GrapheneOS Store Monorepo

A privacy-focused e-commerce platform for GrapheneOS smartphones built with a modern monorepo architecture.

## 🏗️ Architecture

This monorepo contains:

- **Apps**: Main applications
  - `apps/frontend`: React.js customer storefront
  - `apps/backend`: Node.js/Express API server
  
- **Packages**: Shared utilities and configurations
  - `packages/shared-types`: TypeScript type definitions
  - `packages/shared-utils`: Common utilities and helpers
  - `packages/eslint-config`: Shared ESLint configurations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB 4.4+

### Installation

```bash
# Install all dependencies
npm install

# Install TypeScript globally (optional)
npm install -g typescript
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Start individual services
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### Building

```bash
# Build all packages and apps
npm run build

# Build individual apps
npm run build:frontend
npm run build:backend
```

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific apps
npm run test:frontend
npm run test:backend
npm run test:e2e
```

### Linting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📁 Project Structure

```
graphene-mono/
├── apps/
│   ├── frontend/          # React.js storefront
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.js
│   └── backend/           # Node.js API
│       ├── src/
│       ├── package.json
│       └── server.js
├── packages/
│   ├── shared-types/      # TypeScript definitions
│   ├── shared-utils/      # Common utilities
│   └── eslint-config/     # ESLint configurations
├── docker-compose.yml     # Docker development setup
├── turbo.json            # Turbo monorepo configuration
├── package.json          # Root package.json with workspaces
└── README.md
```

## 🛠️ Available Scripts

### Root Level Commands

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all packages and apps
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run clean` - Clean all build artifacts
- `npm run fresh-install` - Clean install all dependencies

### Docker Commands

- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:prod` - Start production environment with Docker
- `npm run docker:test` - Run tests in Docker environment

### Version Management

- `npm run changeset` - Create a new changeset
- `npm run changeset:version` - Update package versions
- `npm run changeset:publish` - Publish packages

## 🏪 Applications

### Frontend (`@graphene-store/frontend`)

React.js-based customer storefront with:
- Product catalog and search
- Shopping cart and checkout
- User authentication and profiles
- Payment integration (PayPal, Bitcoin, Monero)
- Admin dashboard
- SEO optimization with React Helmet Async

**Tech Stack**: React 19, Vite, Tailwind CSS, Redux Toolkit

### Backend (`@graphene-store/backend`)

Node.js/Express API server with:
- RESTful API endpoints
- MongoDB integration with Mongoose
- Authentication & authorization with JWT
- Payment processing (PayPal, Bitcoin, Monero)
- Order management and lead time tracking
- Email notifications with AWS SES
- Admin functionality
- Comprehensive testing with Vitest

**Tech Stack**: Node.js, Express, MongoDB, JWT, Winston

## 📦 Shared Packages

### `@graphene-store/shared-types`

TypeScript type definitions shared between frontend and backend:
- Product, User, Order interfaces
- API response types
- Form validation types
- Constants and enums

### `@graphene-store/shared-utils`

Common utilities and helper functions:
- Currency and date formatting
- Validation functions
- String manipulation
- Lead time calculations
- API utilities

### `@graphene-store/eslint-config`

Shared ESLint configurations:
- Base configuration for all projects
- React-specific rules
- Node.js-specific rules

## 🐳 Docker Support

The project includes Docker configurations for different environments:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml up

# Testing
docker-compose -f docker-compose.test.yml up
```

## 🧪 Testing Strategy

- **Unit Tests**: Individual component/function testing with Vitest
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Full user journey testing with Playwright
- **Performance Tests**: Load testing with Artillery
- **Security Tests**: Vulnerability and penetration testing

## 🔧 Configuration

### Environment Variables

Create `.env` files in the appropriate directories:

- `apps/backend/.env` - Backend configuration
- `apps/frontend/.env` - Frontend configuration

### Database Setup

1. Install MongoDB locally or use Docker
2. Create database: `graphene_store`
3. Run seed scripts: `npm run seed --workspace=@graphene-store/backend`

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd apps/frontend
npm run build
# Deploy to Vercel
```

### Backend (AWS/Docker)

```bash
cd apps/backend
# Build Docker image
docker build -t graphene-store-backend .
# Deploy to your preferred platform
```

## 💰 Payment Integration

The platform supports multiple payment methods:

- **PayPal**: Standard online payments with refund support
- **Bitcoin**: Cryptocurrency payments via Blockonomics (2 confirmations required)
- **Monero**: Private cryptocurrency payments via GloBee (10 confirmations required)

## 📱 Product Features

- **GrapheneOS Smartphones**: Google Pixel phones pre-installed with GrapheneOS
- **Lead Time Management**: 5-7 working days for custom preparation
- **Privacy App Installation**: Optional service for enhanced privacy
- **JIT Inventory**: Just-in-time ordering model
- **Multi-currency Support**: All pricing in GBP with crypto conversion

## 🔒 Security Features

- **Privacy-First Design**: Minimal PII collection and secure data handling
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Data Encryption**: All data encrypted in transit and at rest
- **OWASP Compliance**: Following security best practices
- **JWT Authentication**: Secure user session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📋 Monorepo Benefits

- **Code Sharing**: Shared types, utilities, and configurations
- **Consistent Dependencies**: Unified package management
- **Atomic Changes**: Cross-package changes in single commits
- **Simplified CI/CD**: Single pipeline for all packages
- **Better Developer Experience**: Single checkout, unified tooling
- **Version Management**: Coordinated releases with Changesets

## 🔗 Related Documentation

- [Frontend Documentation](./apps/frontend/README.md)
- [Backend Documentation](./apps/backend/README.md)
- [Product Requirements](./PRD.md)
- [Architectural Design](./High-Level%20Architectural%20Design.md)
- [Claude Instructions](./CLAUDE.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please email security@grapheneos-store.com

---

**GrapheneOS Store Team** 🛡️📱