# 🧠 devCollab - Real-Time Collaboration Platform

A production-ready, full-stack real-time collaboration platform built with React, FastAPI, WebSockets, and Redis.

## 🎯 Overview

devCollab is a modern collaboration platform that enables real-time communication and collaboration between users. It features live chat, real-time updates, and a scalable architecture designed for production deployment.

## ✨ Features

- 🔐 **JWT-based Authentication** - Secure user registration and login
- 🏠 **Collaboration Rooms** - Create and join unique collaboration spaces
- ⚡ **Real-Time Communication** - Live chat with WebSocket connections
- 👥 **Active Users** - See who's currently online in each room
- 🔄 **Scalable Architecture** - Redis Pub/Sub for horizontal scaling
- 🎨 **Modern UI** - Clean, minimalist design with smooth interactions

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - WebSocket client for real-time features

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Reliable relational database
- **Redis** - In-memory data store for real-time features
- **JWT** - JSON Web Tokens for authentication
- **Socket.IO** - WebSocket library for real-time communication

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Makefile** - Development commands
- **Vercel** - Frontend deployment
- **Render** - Backend deployment

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │    Redis    │
│   (React)   │◄──►│  (FastAPI)  │◄──►│   (Pub/Sub) │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │ (Database)  │
                   └─────────────┘
```

## 📁 Project Structure

```
devCollab/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── websocket/      # WebSocket handlers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
│   ├── architecture.md
│   ├── authentication.md
│   ├── websockets.md
│   ├── live_chatting.md
│   ├── backend_logic.md
│   ├── frontend_logic.md
│   └── deployment.md
├── docker-compose.yml      # Multi-container setup
├── Makefile               # Development commands
├── .env                   # Environment variables
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.9+ (for local backend development)

### Using Docker (Recommended)
```bash
# Build and start all services
make up

# View logs
make logs

# Stop services
make down
```

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## 🛠️ Development Commands

```bash
make build      # Build Docker images
make up         # Start all services
make down       # Stop all services
make logs       # View logs
make migrate    # Run database migrations
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect frontend directory to Vercel
2. Set environment variables
3. Deploy automatically on git push

### Backend (Render)
1. Connect backend directory to Render
2. Configure PostgreSQL and Redis add-ons
3. Set environment variables
4. Deploy automatically on git push

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture](docs/architecture.md) - System design overview
- [Authentication](docs/authentication.md) - JWT implementation
- [WebSockets](docs/websockets.md) - Real-time communication
- [Live Chatting](docs/live_chatting.md) - Chat system implementation
- [Backend Logic](docs/backend_logic.md) - API structure
- [Frontend Logic](docs/frontend_logic.md) - Component architecture
- [Deployment](docs/deployment.md) - Production deployment guide

## 🔐 Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/devcollab

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Status

🚧 **Currently Under Development** - Building production-ready real-time collaboration features

---

Built with ❤️ by [Miracle Amajama](https://miracle-amajama-my-portfolio.vercel.app)
