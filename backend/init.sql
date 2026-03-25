-- Database initialization script for devCollab
-- This script is run when PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist (handled by environment variables)
-- Tables will be created automatically by SQLAlchemy models
