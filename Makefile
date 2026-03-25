.PHONY: help build up down logs migrate clean test

# Default target
help:
	@echo "🧠 devCollab - Real-Time Collaboration Platform"
	@echo ""
	@echo "Available commands:"
	@echo "  build     - Build Docker images"
	@echo "  up        - Start all services with Docker Compose"
	@echo "  down      - Stop all services"
	@echo "  logs      - Show logs for all services"
	@echo "  migrate   - Run database migrations"
	@echo "  clean     - Clean up Docker containers and images"
	@echo "  test      - Run tests"
	@echo "  dev-frontend - Start frontend in development mode"
	@echo "  dev-backend  - Start backend in development mode"

# Build Docker images
build:
	@echo "🐳 Building Docker images..."
	docker-compose build

# Start all services
up:
	@echo "🚀 Starting devCollab services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"
	@echo "📊 API Docs: http://localhost:8000/docs"

# Stop all services
down:
	@echo "🛑 Stopping devCollab services..."
	docker-compose down
	@echo "✅ Services stopped!"

# Show logs
logs:
	@echo "📋 Showing logs..."
	docker-compose logs -f

# Run database migrations
migrate:
	@echo "🗄️ Running database migrations..."
	docker-compose exec backend alembic upgrade head
	@echo "✅ Migrations completed!"

# Clean up Docker containers and images
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "✅ Cleanup completed!"

# Run tests
test:
	@echo "🧪 Running tests..."
	docker-compose exec backend pytest
	@echo "✅ Tests completed!"

# Start frontend in development mode
dev-frontend:
	@echo "⚛️ Starting frontend in development mode..."
	cd frontend && npm run dev

# Start backend in development mode
dev-backend:
	@echo "🐍 Starting backend in development mode..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Create initial database migration
init-migration:
	@echo "🗄️ Creating initial migration..."
	docker-compose exec backend alembic revision --autogenerate -m "Initial migration"

# Reset database
reset-db:
	@echo "🔄 Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 5
	$(MAKE) migrate
	@echo "✅ Database reset completed!"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

# Production build
build-prod:
	@echo "🏗️ Building for production..."
	cd frontend && npm run build
	@echo "✅ Production build completed!"
