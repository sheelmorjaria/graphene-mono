# GrapheneOS Store - Docker Management Makefile

.PHONY: help build up down logs clean test dev prod setup-env

# Default target
help:
	@echo "GrapheneOS Store - Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  setup-env     - Create .env file from example"
	@echo "  build         - Build all Docker images"
	@echo "  dev           - Start development environment"
	@echo "  prod          - Start production environment"
	@echo "  test          - Run test suite in containers"
	@echo "  up            - Start all services (production)"
	@echo "  down          - Stop all services"
	@echo "  logs          - Show logs from all services"
	@echo "  clean         - Remove all containers, volumes, and images"
	@echo "  backend-logs  - Show backend logs"
	@echo "  frontend-logs - Show frontend logs"
	@echo "  db-logs       - Show database logs"
	@echo "  restart       - Restart all services"
	@echo "  shell-backend - Open shell in backend container"
	@echo "  shell-db      - Open MongoDB shell"

# Setup environment file
setup-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
		echo "Please edit .env file with your configuration"; \
	else \
		echo ".env file already exists"; \
	fi

# Build all images
build:
	docker compose build

# Development environment
dev: setup-env
	docker compose -f docker-compose.dev.yml up --build

# Production environment  
prod: setup-env
	docker compose up --build -d
	@echo "Production environment started"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:5000"

# Start all services (production)
up: setup-env
	docker compose up -d

# Stop all services
down:
	docker compose down
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.test.yml down

# Show logs
logs:
	docker compose logs -f

# Restart services
restart: down up

# Individual service logs
backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend

db-logs:
	docker compose logs -f mongodb

# Shell access
shell-backend:
	docker compose exec backend /bin/sh

shell-db:
	docker compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Testing
test: setup-env
	@echo "Running test suite..."
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit backend-test frontend-test
	docker compose -f docker-compose.test.yml down

# E2E tests
test-e2e: setup-env
	@echo "Running E2E tests..."
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit e2e-test
	docker compose -f docker-compose.test.yml down

# Cleanup everything
clean:
	@echo "Cleaning up Docker resources..."
	docker compose down -v --remove-orphans
	docker compose -f docker-compose.dev.yml down -v --remove-orphans  
	docker compose -f docker-compose.test.yml down -v --remove-orphans
	docker system prune -f
	docker volume prune -f
	@echo "Cleanup completed"

# Database operations
db-backup:
	@echo "Creating database backup..."
	docker compose exec mongodb mongodump --username admin --password password123 --authenticationDatabase admin --db graphene_store --out /data/backup/
	docker cp graphene-mongodb:/data/backup ./backup/

db-restore:
	@echo "Restoring database from backup..."
	docker cp ./backup/ graphene-mongodb:/data/backup/
	docker compose exec mongodb mongorestore --username admin --password password123 --authenticationDatabase admin --db graphene_store /data/backup/graphene_store/

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:5000/api/health || echo "Backend unhealthy"
	@curl -f http://localhost:3000/health || echo "Frontend unhealthy"

# Monitor resources
monitor:
	docker stats

# Update dependencies
update-deps:
	docker compose exec backend npm update
	docker compose exec frontend npm update
	docker compose restart backend frontend