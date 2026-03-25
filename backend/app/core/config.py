from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://devcollab:devcollab123@localhost:5432/devcollab"
    POSTGRES_USER: str = "devcollab"
    POSTGRES_PASSWORD: str = "devcollab123"
    POSTGRES_DB: str = "devcollab"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    
    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # WebSocket CORS
    WEBSOCKET_CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def websocket_cors_allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.WEBSOCKET_CORS_ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = "../.env"
        case_sensitive = True

settings = Settings()
